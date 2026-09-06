"use client";

import { useEffect, useState, useCallback } from "react";
import { Shield, Plus, CheckCircle2, XCircle, Clock, Calendar, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { CustomTable, CustomBadge } from "@/components/custom";
import { money, dateTime } from "@/lib/format";

interface WarrantyClaim {
  id: string; claimNo: string; serialNo: string | null; warrantyStart: string;
  warrantyEnd: string; warrantyType: string; issueDescription: string;
  status: string; resolution: string | null; estimatedCost: number; actualCost: number;
  isWarrantyValid: boolean; createdAt: string;
  product?: { id: string; name: string } | null;
  customer?: { id: string; name: string } | null;
}

const STATUS_TONE: Record<string, "green" | "amber" | "gray" | "red" | "primary"> = {
  COMPLETED: "green", APPROVED: "primary", SUBMITTED: "amber", INSPECTION: "primary",
  REJECTED: "red", IN_REPAIR: "amber", REPLACEMENT_READY: "green", CANCELLED: "gray",
};

const RESOLUTIONS = ["REPAIR", "REPLACEMENT", "REFUND", "STORE_CREDIT", "NONE"];

export default function WarrantyPage() {
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [actionClaim, setActionClaim] = useState<WarrantyClaim | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: WarrantyClaim[] }>("/warranty?limit=100");
      setClaims(res.data);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-6 text-white shadow-md">
        <div>
          <p className="flex items-center gap-2 text-sm text-emerald-100"><Shield size={15} /> Warranty Management</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Warranty Claims</h1>
          <p className="mt-1 text-sm text-emerald-200">§10.22 — Claim → Inspection → Approved → Repair/Replace → Complete</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="hidden items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium ring-1 ring-white/20 transition hover:bg-white/20 sm:inline-flex">
          <Plus size={15} /> New Claim
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Claims" value={claims.length} icon={Shield} />
        <StatCard label="Active" value={claims.filter((c) => !["COMPLETED", "CANCELLED", "REJECTED"].includes(c.status)).length} icon={Clock} tone="primary" />
        <StatCard label="Completed" value={claims.filter((c) => c.status === "COMPLETED").length} icon={CheckCircle2} tone="green" />
        <StatCard label="Expired Warranty" value={claims.filter((c) => !c.isWarrantyValid).length} icon={AlertTriangle} tone="red" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <CustomTable
          columns={[
            { key: "no", header: "Claim #", render: (c) => <span className="font-mono text-xs font-semibold text-primary-700">{c.claimNo}</span> },
            { key: "product", header: "Product", render: (c) => <span className="text-sm text-gray-600">{c.product?.name || "—"}</span> },
            { key: "customer", header: "Customer", render: (c) => <span className="text-sm text-gray-600">{c.customer?.name || "—"}</span> },
            { key: "serial", header: "Serial", render: (c) => <span className="font-mono text-xs text-gray-500">{c.serialNo || "—"}</span> },
            { key: "type", header: "Warranty", render: (c) => <span className="text-xs uppercase text-gray-400">{c.warrantyType}</span> },
            { key: "valid", header: "Valid", render: (c) => (
              c.isWarrantyValid ? <CheckCircle2 size={15} className="text-emerald-500" /> : <XCircle size={15} className="text-red-400" />
            )},
            { key: "end", header: "Expires", render: (c) => <span className="text-xs text-gray-500">{c.warrantyEnd}</span> },
            { key: "status", header: "Status", render: (c) => <CustomBadge tone={STATUS_TONE[c.status] ?? "gray"}>{c.status}</CustomBadge> },
            { key: "actions", header: "", align: "right", render: (c) => (
              <button onClick={() => setActionClaim(c)}
                className="rounded p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600" title="Process">
                <Clock size={14} />
              </button>
            )},
          ]}
          data={claims}
          rowKey={(c) => c.id}
          loading={loading}
          emptyIcon={Shield}
          emptyMessage="No warranty claims yet."
        />
      </div>

      {showForm && <WarrantyForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
      {actionClaim && <WarrantyActionModal claim={actionClaim} onClose={() => setActionClaim(null)} onSaved={() => { setActionClaim(null); load(); }} />}
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

function WarrantyForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [warrantyType, setWarrantyType] = useState("MANUFACTURER");
  const [warrantyStart, setWarrantyStart] = useState(new Date().toISOString().split("T")[0]);
  const [warrantyEnd, setWarrantyEnd] = useState("");
  const [issue, setIssue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ data: any[] }>("/products?limit=100").then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  const submit = async () => {
    if (!productId || !issue || !warrantyEnd) { setError("Product, issue, and warranty end date required"); return; }
    setSaving(true); setError("");
    try {
      await api.post("/warranty", {
        productId, serialNo, warrantyType, warrantyStart, warrantyEnd,
        issueDescription: issue,
      });
      onSaved();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">File Warranty Claim</h3>
        {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="mt-4 grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial / IMEI</label>
              <input value={serialNo} onChange={(e) => setSerialNo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Type</label>
              <select value={warrantyType} onChange={(e) => setWarrantyType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="MANUFACTURER">Manufacturer</option>
                <option value="SELLER">Seller</option>
                <option value="EXTENDED">Extended</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Start</label>
              <input type="date" value={warrantyStart} onChange={(e) => setWarrantyStart(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warranty End *</label>
              <input type="date" value={warrantyEnd} onChange={(e) => setWarrantyEnd(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description *</label>
            <textarea value={issue} onChange={(e) => setIssue(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} placeholder="Describe the issue..." />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "Filing..." : "File Claim"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WarrantyActionModal({ claim, onClose, onSaved }: { claim: WarrantyClaim; onClose: () => void; onSaved: () => void }) {
  const [action, setAction] = useState("inspect");
  const [notes, setNotes] = useState("");
  const [resolution, setResolution] = useState("REPAIR");
  const [actualCost, setActualCost] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const ACTIONS: Record<string, string[]> = {
    SUBMITTED: ["inspect", "cancel"],
    INSPECTION: ["approve", "reject", "cancel"],
    APPROVED: ["start_repair", "complete", "cancel"],
    IN_REPAIR: ["ready", "complete", "cancel"],
    REPLACEMENT_READY: ["complete", "cancel"],
  };

  const validActions = ACTIONS[claim.status] || [];

  const submit = async () => {
    setSaving(true); setError("");
    try {
      await api.post(`/warranty/${claim.id}/action`, {
        action, notes, resolution,
        actualCost: actualCost ? parseFloat(actualCost) : undefined,
      });
      onSaved();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">Warranty Action — {claim.claimNo}</h3>
        <p className="text-sm text-gray-500">Product: {claim.product?.name} | Status: <CustomBadge tone={STATUS_TONE[claim.status] ?? "gray"}>{claim.status}</CustomBadge></p>
        {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="mt-4 grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action *</label>
            <select value={action} onChange={(e) => setAction(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {validActions.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          {action === "complete" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                <select value={resolution} onChange={(e) => setResolution(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {RESOLUTIONS.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Cost</label>
                <input type="number" step="0.01" value={actualCost} onChange={(e) => setActualCost(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="0.00" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} placeholder="Inspection/repair notes..." />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={submit} disabled={saving || validActions.length === 0}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "Processing..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
