"use client";

import { useEffect, useState } from "react";
import { Plus, Send, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp, FileText, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

interface QuotationItem {
  id: string;
  productId: string;
  name?: string;
  qty: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
}

interface Quotation {
  id: string;
  quotationNo: string;
  version: number;
  status: string;
  total: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  validUntil?: string | null;
  note?: string | null;
  createdAt: string;
  customer?: { id: string; name: string; phone?: string } | null;
  items: QuotationItem[];
  revisions?: { version: number; changeNote?: string; createdAt: string }[];
  salesOrders?: { id: string; orderNo: string; status: string }[];
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-50 text-blue-700",
  CUSTOMER_REVIEW: "bg-purple-50 text-purple-700",
  ACCEPTED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  CONVERTED: "bg-teal-50 text-teal-700",
  EXPIRED: "bg-orange-50 text-orange-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const ACTIONS: Record<string, string[]> = {
  DRAFT: ["send", "revise"],
  SENT: ["accept", "reject", "revise", "convert"],
  CUSTOMER_REVIEW: ["accept", "reject", "revise"],
  ACCEPTED: ["convert"],
};

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create form state
  const [form, setForm] = useState({
    branchId: "",
    customerId: "",
    validUntil: "",
    note: "",
    items: [{ productId: "", name: "", qty: 1, unitPrice: 0, discountAmount: 0, taxAmount: 0 }],
  });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const r: any = await api.get("/v1/sales/quotations");
      setQuotations(r.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function doAction(id: string, action: string, extra?: Record<string, any>) {
    setActionLoading(`${id}-${action}`);
    try {
      if (action === "send") await api.post(`/v1/sales/quotations/${id}/send`);
      else if (action === "accept") await api.post(`/v1/sales/quotations/${id}/accept`);
      else if (action === "reject") {
        const reason = prompt("Rejection reason (optional):");
        await api.post(`/v1/sales/quotations/${id}/reject`, { reason });
      } else if (action === "convert") {
        const warehouseId = prompt("Warehouse ID for stock reservation (optional):");
        await api.post(`/v1/sales/quotations/${id}/convert`, { warehouseId });
      }
      await load();
    } catch (e: any) {
      alert(e.response?.data?.error ?? e.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function createQuotation() {
    try {
      const payload = {
        branchId: form.branchId || "default",
        customerId: form.customerId || null,
        validUntil: form.validUntil || null,
        note: form.note || null,
        items: form.items.filter((i) => i.productId).map((i) => ({
          ...i,
          qty: Number(i.qty),
          unitPrice: Number(i.unitPrice),
          discountAmount: Number(i.discountAmount),
          taxAmount: Number(i.taxAmount),
        })),
      };
      await api.post("/v1/sales/quotations", payload);
      setShowCreate(false);
      setForm({ branchId: "", customerId: "", validUntil: "", note: "", items: [{ productId: "", name: "", qty: 1, unitPrice: 0, discountAmount: 0, taxAmount: 0 }] });
      await load();
    } catch (e: any) {
      alert(e.response?.data?.error ?? e.message);
    }
  }

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { productId: "", name: "", qty: 1, unitPrice: 0, discountAmount: 0, taxAmount: 0 }] }));
  }

  function updateItem(idx: number, field: string, value: any) {
    setForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, items };
    });
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quotations</h1>
          <p className="text-sm text-gray-500">Draft → Sent → Accepted → Sales Order</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus size={15} /> New Quotation
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">New Quotation</h2>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Branch ID *</label>
              <input value={form.branchId} onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="branch-id" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Customer ID</label>
              <input value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="optional" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Valid Until</label>
              <input type="date" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          {/* Line items */}
          <div className="mb-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-400">
                  <th className="pb-2 pr-3">Product ID</th>
                  <th className="pb-2 pr-3">Name</th>
                  <th className="pb-2 pr-3 w-20">Qty</th>
                  <th className="pb-2 pr-3 w-28">Unit Price</th>
                  <th className="pb-2 pr-3 w-24">Discount</th>
                  <th className="pb-2 w-24">Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {form.items.map((item, idx) => (
                  <tr key={idx}>
                    {(["productId", "name", "qty", "unitPrice", "discountAmount", "taxAmount"] as const).map((f) => (
                      <td key={f} className="py-1 pr-3">
                        <input
                          type={["qty", "unitPrice", "discountAmount", "taxAmount"].includes(f) ? "number" : "text"}
                          value={(item as any)[f]}
                          onChange={(e) => updateItem(idx, f, e.target.value)}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                          min={0}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addItem} className="mb-4 text-xs text-primary-600 hover:underline">+ Add line</button>

          <div className="flex gap-2">
            <button onClick={createQuotation} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
              Create Quotation
            </button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quotations list */}
      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
      ) : quotations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
          No quotations yet. Create your first one.
        </div>
      ) : (
        <div className="space-y-3">
          {quotations.map((q) => (
            <div key={q.id} className="rounded-xl border border-gray-100 bg-white shadow-sm">
              {/* Header row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-800">{q.quotationNo}</span>
                    <span className="text-xs text-gray-400">v{q.version}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[q.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {q.status}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {q.customer?.name ?? "No customer"} · {new Date(q.createdAt).toLocaleDateString()}
                    {q.validUntil && ` · Valid until ${new Date(q.validUntil).toLocaleDateString()}`}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">৳{Number(q.total).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{q.items.length} items</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5">
                  {(ACTIONS[q.status] ?? []).map((action) => (
                    <button
                      key={action}
                      onClick={() => doAction(q.id, action)}
                      disabled={actionLoading === `${q.id}-${action}`}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {action === "send" && <Send size={11} />}
                      {action === "accept" && <CheckCircle size={11} />}
                      {action === "reject" && <XCircle size={11} />}
                      {action === "revise" && <RefreshCw size={11} />}
                      {action === "convert" && <ArrowRight size={11} />}
                      {action}
                    </button>
                  ))}
                  {q.salesOrders && q.salesOrders.length > 0 && (
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700">
                      → {q.salesOrders[0].orderNo}
                    </span>
                  )}
                </div>

                <button onClick={() => setExpanded(expanded === q.id ? null : q.id)} className="text-gray-400 hover:text-gray-600">
                  {expanded === q.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Expanded detail */}
              {expanded === q.id && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Line items */}
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Line Items</h3>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-400">
                            <th className="pb-1">Product</th>
                            <th className="pb-1 text-right">Qty</th>
                            <th className="pb-1 text-right">Price</th>
                            <th className="pb-1 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {q.items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-1 text-gray-700">{item.name || item.productId}</td>
                              <td className="py-1 text-right text-gray-600">{Number(item.qty)}</td>
                              <td className="py-1 text-right text-gray-600">৳{Number(item.unitPrice).toLocaleString()}</td>
                              <td className="py-1 text-right font-medium text-gray-800">৳{Number(item.lineTotal).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-gray-100">
                            <td colSpan={3} className="pt-2 text-right text-gray-500">Subtotal</td>
                            <td className="pt-2 text-right font-medium">৳{Number(q.subtotal).toLocaleString()}</td>
                          </tr>
                          {Number(q.discountTotal) > 0 && (
                            <tr>
                              <td colSpan={3} className="text-right text-gray-500">Discount</td>
                              <td className="text-right text-red-500">-৳{Number(q.discountTotal).toLocaleString()}</td>
                            </tr>
                          )}
                          {Number(q.taxTotal) > 0 && (
                            <tr>
                              <td colSpan={3} className="text-right text-gray-500">Tax</td>
                              <td className="text-right text-gray-600">৳{Number(q.taxTotal).toLocaleString()}</td>
                            </tr>
                          )}
                          <tr>
                            <td colSpan={3} className="text-right font-semibold text-gray-800">Total</td>
                            <td className="text-right font-bold text-gray-900">৳{Number(q.total).toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Revision history */}
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        <FileText size={11} className="mr-1 inline" />Version History
                      </h3>
                      {q.revisions && q.revisions.length > 0 ? (
                        <div className="space-y-1.5">
                          {q.revisions.map((rev) => (
                            <div key={rev.version} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs">
                              <span className="font-medium text-gray-700">v{rev.version}</span>
                              <span className="text-gray-500">{rev.changeNote ?? "—"}</span>
                              <span className="ml-auto text-gray-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No revision history</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
