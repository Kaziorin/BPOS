"use client";

import { useEffect, useState } from "react";
import { Plus, Eye, Ban, Printer, CreditCard, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "@/lib/api";

interface Invoice {
  id: string;
  invoiceNo: string;
  invoiceType: string;
  status: string;
  issueDate: string;
  dueDate?: string | null;
  total: number;
  paidTotal: number;
  note?: string | null;
  customer?: { id: string; name: string; phone?: string } | null;
  _count?: { items: number };
}

const TYPE_COLOR: Record<string, string> = {
  TAX: "bg-blue-50 text-blue-700",
  STANDARD: "bg-gray-100 text-gray-600",
  CREDIT_NOTE: "bg-red-50 text-red-600",
  DEBIT_NOTE: "bg-orange-50 text-orange-700",
  PROFORMA: "bg-purple-50 text-purple-700",
};

const STATUS_COLOR: Record<string, string> = {
  ISSUED: "bg-yellow-50 text-yellow-700",
  PARTIALLY_PAID: "bg-blue-50 text-blue-700",
  PAID: "bg-green-50 text-green-700",
  VOID: "bg-gray-100 text-gray-400",
};

const INVOICE_TYPES = ["TAX", "STANDARD", "CREDIT_NOTE", "DEBIT_NOTE"];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [renderData, setRenderData] = useState<any>(null);

  // Create form
  const [form, setForm] = useState({
    branchId: "", customerId: "", invoiceType: "STANDARD", dueDate: "", note: "",
    items: [{ description: "", qty: 1, unitPrice: 0, discountAmount: 0, taxAmount: 0 }],
  });

  // Allocate form
  const [allocForm, setAllocForm] = useState({
    branchId: "", customerId: "", method: "CASH", totalAmount: 0, reference: "",
    allocations: [{ invoiceId: "", amount: 0 }],
  });

  useEffect(() => { load(); }, [filterType, filterStatus]);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("invoiceType", filterType);
      if (filterStatus) params.set("status", filterStatus);
      const r: any = await api.get(`/v1/invoices?${params}`);
      setInvoices(r.data.data ?? []);
    } finally { setLoading(false); }
  }

  async function createInvoice() {
    try {
      await api.post("/v1/invoices", {
        ...form,
        items: form.items.map((i) => ({ ...i, qty: Number(i.qty), unitPrice: Number(i.unitPrice), discountAmount: Number(i.discountAmount), taxAmount: Number(i.taxAmount) })),
      });
      setShowCreate(false);
      await load();
    } catch (e: any) { alert(e.response?.data?.error ?? e.message); }
  }

  async function voidInvoice(id: string) {
    if (!confirm("Void this invoice?")) return;
    try { await api.post(`/v1/invoices/${id}/void`); await load(); }
    catch (e: any) { alert(e.response?.data?.error ?? e.message); }
  }

  async function renderInvoice(id: string, format: string) {
    try {
      const r: any = await api.get(`/v1/invoices/${id}/render?format=${format}`);
      setRenderData(r.data.data);
    } catch (e: any) { alert(e.response?.data?.error ?? e.message); }
  }

  async function allocatePayment() {
    try {
      await api.post("/v1/invoices/payments/allocate", {
        ...allocForm,
        totalAmount: Number(allocForm.totalAmount),
        allocations: allocForm.allocations.map((a) => ({ ...a, amount: Number(a.amount) })),
      });
      setShowAllocate(false);
      await load();
    } catch (e: any) { alert(e.response?.data?.error ?? e.message); }
  }

  const outstanding = invoices.filter((i) => i.status !== "PAID" && i.status !== "VOID");
  const totalOutstanding = outstanding.reduce((s, i) => s + Number(i.total) - Number(i.paidTotal), 0);

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Invoice Engine</h1>
          <p className="text-sm text-gray-500">Tax · Standard · Credit Note · Debit Note · Recurring</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAllocate(true)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <CreditCard size={15} /> Allocate Payment
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">
            <Plus size={15} /> New Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Invoices", value: invoices.length, fmt: false },
          { label: "Outstanding", value: outstanding.length, fmt: false },
          { label: "Outstanding Amount", value: totalOutstanding, fmt: true },
          { label: "Paid", value: invoices.filter((i) => i.status === "PAID").length, fmt: false },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {s.fmt ? `৳${Number(s.value).toLocaleString()}` : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">All Types</option>
          {INVOICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">All Status</option>
          {["ISSUED", "PARTIALLY_PAID", "PAID", "VOID"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={load} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">New Invoice</h2>
          <div className="mb-4 grid grid-cols-4 gap-3">
            {[
              { label: "Branch ID *", key: "branchId", type: "text" },
              { label: "Customer ID", key: "customerId", type: "text" },
              { label: "Due Date", key: "dueDate", type: "date" },
            ].map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-gray-600">{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Type</label>
              <select value={form.invoiceType} onChange={(e) => setForm((p) => ({ ...p, invoiceType: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                {INVOICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <table className="mb-3 w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-400">
              <th className="pb-1 pr-2">Description</th><th className="pb-1 pr-2 w-16">Qty</th>
              <th className="pb-1 pr-2 w-24">Price</th><th className="pb-1 pr-2 w-20">Disc</th><th className="pb-1 w-20">Tax</th>
            </tr></thead>
            <tbody>{form.items.map((item, idx) => (
              <tr key={idx}>{(["description", "qty", "unitPrice", "discountAmount", "taxAmount"] as const).map((f) => (
                <td key={f} className="py-1 pr-2">
                  <input type={f === "description" ? "text" : "number"} value={(item as any)[f]}
                    onChange={(e) => { const items = [...form.items]; (items[idx] as any)[f] = e.target.value; setForm((p) => ({ ...p, items })); }}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" min={0} />
                </td>
              ))}</tr>
            ))}</tbody>
          </table>
          <button onClick={() => setForm((p) => ({ ...p, items: [...p.items, { description: "", qty: 1, unitPrice: 0, discountAmount: 0, taxAmount: 0 }] }))}
            className="mb-4 text-xs text-primary-600 hover:underline">+ Add line</button>
          <div className="flex gap-2">
            <button onClick={createInvoice} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Create</button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Allocate payment form */}
      {showAllocate && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">Allocate Payment Across Invoices</h2>
          <div className="mb-4 grid grid-cols-4 gap-3">
            {[
              { label: "Branch ID *", key: "branchId" },
              { label: "Customer ID", key: "customerId" },
              { label: "Method", key: "method" },
              { label: "Total Amount *", key: "totalAmount" },
            ].map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-gray-600">{f.label}</label>
                <input type={f.key === "totalAmount" ? "number" : "text"} value={(allocForm as any)[f.key]}
                  onChange={(e) => setAllocForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            ))}
          </div>
          <p className="mb-2 text-xs font-medium text-gray-600">Allocations (Invoice ID → Amount)</p>
          {allocForm.allocations.map((a, idx) => (
            <div key={idx} className="mb-2 flex gap-2">
              <input placeholder="Invoice ID" value={a.invoiceId}
                onChange={(e) => { const al = [...allocForm.allocations]; al[idx].invoiceId = e.target.value; setAllocForm((p) => ({ ...p, allocations: al })); }}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <input type="number" placeholder="Amount" value={a.amount}
                onChange={(e) => { const al = [...allocForm.allocations]; al[idx].amount = Number(e.target.value); setAllocForm((p) => ({ ...p, allocations: al })); }}
                className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          ))}
          <button onClick={() => setAllocForm((p) => ({ ...p, allocations: [...p.allocations, { invoiceId: "", amount: 0 }] }))}
            className="mb-4 text-xs text-primary-600 hover:underline">+ Add invoice</button>
          <div className="flex gap-2">
            <button onClick={allocatePayment} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Allocate</button>
            <button onClick={() => setShowAllocate(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Render preview modal */}
      {renderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">Invoice Preview — {renderData.invoice?.invoiceNo}</h2>
            <div className="mb-3 rounded-lg bg-gray-50 p-3 text-xs font-mono text-gray-700 overflow-auto max-h-64">
              <pre>{JSON.stringify({ invoiceNo: renderData.invoice?.invoiceNo, total: renderData.invoice?.total, customer: renderData.invoice?.customer?.name, template: renderData.template?.templateType, qrData: renderData.qrData }, null, 2)}</pre>
            </div>
            <p className="mb-3 text-xs text-gray-400">PDF generation: stubbed — Prompt 39 wires actual PDF queue</p>
            <button onClick={() => setRenderData(null)} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">Close</button>
          </div>
        </div>
      )}

      {/* Invoice list */}
      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
      ) : invoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">No invoices found</div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
              <th className="px-5 py-3">Invoice No</th><th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Customer</th><th className="px-5 py-3">Date</th>
              <th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3 text-right">Paid</th>
              <th className="px-5 py-3">Status</th><th className="px-5 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-mono text-xs font-medium text-gray-700">{inv.invoiceNo}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[inv.invoiceType] ?? "bg-gray-100 text-gray-600"}`}>{inv.invoiceType}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{inv.customer?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-500">{new Date(inv.issueDate).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right font-medium text-gray-800">৳{Number(inv.total).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-green-600">৳{Number(inv.paidTotal).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[inv.status] ?? "bg-gray-100 text-gray-600"}`}>{inv.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => renderInvoice(inv.id, "A4")} title="Print A4" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Printer size={13} /></button>
                      <button onClick={() => renderInvoice(inv.id, "THERMAL")} title="Thermal" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Eye size={13} /></button>
                      {inv.status !== "VOID" && inv.status !== "PAID" && (
                        <button onClick={() => voidInvoice(inv.id)} title="Void" className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"><Ban size={13} /></button>
                      )}
                    </div>
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
