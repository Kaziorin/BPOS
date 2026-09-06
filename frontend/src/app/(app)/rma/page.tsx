"use client";

import { useEffect, useState, useCallback } from "react";
import { Wrench, Plus, CheckCircle2, XCircle, Clock, Eye, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { CustomTable, CustomBadge } from "@/components/custom";
import { money, dateTime } from "@/lib/format";

interface RmaItem { id: string; productName: string; qty: number; unitPrice: number; itemCondition: string; defectDescription: string }
interface RmaTicket {
  id: string; rmaNo: string; returnType: string; reason: string; defectType: string;
  status: string; refundAmount: number; inspectionNotes: string;
  createdAt: string; items: RmaItem[];
  sale?: { id: string; invoiceNo: string } | null;
  customer?: { name: string } | null;
}

const STATUS_TONE: Record<string, "green" | "amber" | "gray" | "red" | "primary"> = {
  COMPLETED: "green", APPROVED: "primary", OPEN: "amber", INSPECTION: "primary",
  REJECTED: "red", IN_REPAIR: "amber", READY: "green", CANCELLED: "gray",
};

const DEFECT_TYPES = ["PHYSICAL_DAMAGE", "MANUFACTURING_DEFECT", "WRONG_ITEM", "NOT_AS_DESCRIBED", "OTHER"];
const RETURN_TYPES = ["REFUND", "REPLACEMENT", "REPAIR", "STORE_CREDIT"];

export default function RmaPage() {
  const [tickets, setTickets] = useState<RmaTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [actionTicket, setActionTicket] = useState<RmaTicket | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: RmaTicket[] }>("/rma?limit=100");
      setTickets(res.data);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 text-white shadow-md">
        <div>
          <p className="flex items-center gap-2 text-sm text-blue-100"><Wrench size={15} /> RMA Management</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Return Merchandise Authorization</h1>
          <p className="mt-1 text-sm text-blue-200">§10.22 — Inspection, defect classification, repair/refund/replacement workflow</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="hidden items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium ring-1 ring-white/20 transition hover:bg-white/20 sm:inline-flex">
          <Plus size={15} /> New RMA
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <CustomTable
          columns={[
            { key: "no", header: "RMA #", render: (r) => <span className="font-mono text-xs font-semibold text-primary-700">{r.rmaNo}</span> },
            { key: "sale", header: "Sale", render: (r) => <span className="text-sm text-gray-600">{r.sale?.invoiceNo || "—"}</span> },
            { key: "customer", header: "Customer", render: (r) => <span className="text-sm text-gray-600">{r.customer?.name || "—"}</span> },
            { key: "type", header: "Type", render: (r) => <span className="text-xs uppercase text-gray-400">{r.returnType}</span> },
            { key: "defect", header: "Defect", render: (r) => <span className="text-xs text-gray-500">{r.defectType?.replace(/_/g, " ")}</span> },
            { key: "items", header: "Items", align: "center", render: (r) => <span className="text-sm font-medium">{r.items?.length || 0}</span> },
            { key: "amount", header: "Amount", align: "right", render: (r) => <span className="font-semibold tabular-nums text-gray-900">{money(r.refundAmount)}</span> },
            { key: "status", header: "Status", render: (r) => <CustomBadge tone={STATUS_TONE[r.status] ?? "gray"}>{r.status}</CustomBadge> },
            { key: "date", header: "Date", render: (r) => <span className="text-xs text-gray-500">{dateTime(r.createdAt)}</span> },
            { key: "actions", header: "", align: "right", render: (r) => (
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => setActionTicket(r)}
                  className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="Process">
                  <ArrowRight size={14} />
                </button>
              </div>
            )},
          ]}
          data={tickets}
          rowKey={(r) => r.id}
          loading={loading}
          emptyIcon={Wrench}
          emptyMessage="No RMA tickets yet."
        />
      </div>

      {showForm && <RmaForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
      {actionTicket && <RmaActionModal ticket={actionTicket} onClose={() => setActionTicket(null)} onSaved={() => { setActionTicket(null); load(); }} />}
    </div>
  );
}

function RmaForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [sales, setSales] = useState<any[]>([]);
  const [saleId, setSaleId] = useState("");
  const [returnType, setReturnType] = useState("REFUND");
  const [defectType, setDefectType] = useState("OTHER");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ data: any[] }>("/pos/sales?limit=50").then((r) => setSales(r.data)).catch(() => {});
  }, []);

  const submit = async () => {
    if (!saleId) { setError("Select a sale"); return; }
    setSaving(true); setError("");
    try {
      // Get sale items to auto-populate RMA items
      const sale = sales.find((s) => s.id === saleId);
      await api.post("/rma", {
        saleId, returnType, defectType, reason,
        customerId: sale?.customerId,
        items: [{ productId: saleId, productName: "Item", qty: 1, unitPrice: sale?.total || 0 }],
      });
      onSaved();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">Create RMA Ticket</h3>
        {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="mt-4 grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sale *</label>
            <select value={saleId} onChange={(e) => setSaleId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select sale</option>
              {sales.map((s) => <option key={s.id} value={s.id}>{s.invoiceNo} — {money(s.total)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Type</label>
              <select value={returnType} onChange={(e) => setReturnType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {RETURN_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Defect Type</label>
              <select value={defectType} onChange={(e) => setDefectType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {DEFECT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Description</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} placeholder="Describe the issue..." />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Creating..." : "Create RMA"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RmaActionModal({ ticket, onClose, onSaved }: { ticket: RmaTicket; onClose: () => void; onSaved: () => void }) {
  const [action, setAction] = useState("inspect");
  const [notes, setNotes] = useState("");
  const [resolution, setResolution] = useState("REFUND");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const ACTIONS: Record<string, string[]> = {
    OPEN: ["inspect", "cancel"],
    INSPECTION: ["approve", "reject", "cancel"],
    APPROVED: ["start_repair", "complete", "cancel"],
    IN_REPAIR: ["ready", "complete", "cancel"],
    READY: ["complete", "cancel"],
  };

  const validActions = ACTIONS[ticket.status] || [];

  const submit = async () => {
    setSaving(true); setError("");
    try {
      await api.post(`/rma/${ticket.id}/action`, { action, notes, resolution });
      onSaved();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">RMA Action — {ticket.rmaNo}</h3>
        <p className="text-sm text-gray-500">Current status: <CustomBadge tone={STATUS_TONE[ticket.status] ?? "gray"}>{ticket.status}</CustomBadge></p>
        {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="mt-4 grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action *</label>
            <select value={action} onChange={(e) => setAction(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {validActions.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          {(action === "complete") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
              <select value={resolution} onChange={(e) => setResolution(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="REFUND">Refund</option>
                <option value="REPLACEMENT">Replacement</option>
                <option value="REPAIR">Repair</option>
                <option value="STORE_CREDIT">Store Credit</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} placeholder="Inspection notes..." />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={submit} disabled={saving || validActions.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Processing..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
