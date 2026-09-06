"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Wrench, Plus, RefreshCw, Search, Loader2, Eye, ShieldCheck, AlertTriangle,
  ArrowRight, Trash2, CreditCard, CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";

interface RepairTicket {
  id: string;
  ticketNo: string;
  customerId: string;
  customerName?: string | null;
  customerPhone?: string | null;
  productId: string | null;
  productName?: string | null;
  serialNo: string | null;
  deviceInfo: string | null;
  reportedProblem: string | null;
  diagnosis: string | null;
  status: string;
  priority: string;
  technicianId: string | null;
  technicianName: string | null;
  receivedAt: string;
  dueAt: string | null;
  estimatedCost: number;
  partsCost: number;
  laborCost: number;
  actualCost: number;
  warrantyEligible: number;
  warrantyType: string | null;
  warrantyClaimId: string | null;
  notes: string | null;
  items?: TicketItem[];
  warrantyClaim?: any;
}

interface TicketItem {
  id: string;
  lineType: string;
  productId: string | null;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

interface CustomerOption { id: string; name: string; phone: string | null; }
interface ProductOption { id: string; name: string; sku: string; sellingPrice: number; }
interface StaffOption { id: string; name: string; }

const currency = (v: number) => `৳${v.toLocaleString("en-BD", { minimumFractionDigits: 2 })}`;

const FLOW: Record<string, { next: string; label: string; color: string }> = {
  RECEIVED: { next: "INSPECTION", label: "Start inspection", color: "hover:bg-blue-50 hover:text-blue-600" },
  INSPECTION: { next: "ESTIMATE", label: "Write estimate", color: "hover:bg-amber-50 hover:text-amber-600" },
  ESTIMATE: { next: "APPROVED", label: "Customer approved", color: "hover:bg-emerald-50 hover:text-emerald-600" },
  APPROVED: { next: "REPAIRING", label: "Start repair", color: "hover:bg-indigo-50 hover:text-indigo-600" },
  REPAIRING: { next: "QUALITY_CHECK", label: "Send to QC", color: "hover:bg-purple-50 hover:text-purple-600" },
  QUALITY_CHECK: { next: "READY", label: "Mark ready", color: "hover:bg-teal-50 hover:text-teal-600" },
  READY: { next: "DELIVERED", label: "Deliver & bill", color: "hover:bg-emerald-50 hover:text-emerald-600" },
};

const STATUS_BADGES: Record<string, string> = {
  RECEIVED: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  INSPECTION: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  ESTIMATE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  APPROVED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  REPAIRING: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  QUALITY_CHECK: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  READY: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  DELIVERED: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  CANCELLED: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

const PRIORITY_STYLE: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600", MEDIUM: "bg-blue-50 text-blue-600",
  HIGH: "bg-amber-50 text-amber-600", URGENT: "bg-rose-50 text-rose-600",
};

export default function RepairPage() {
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [ticketForm, setTicketForm] = useState<any>({
    customerId: "", productId: "", serialNo: "", deviceInfo: "", reportedProblem: "",
    priority: "MEDIUM", technicianId: "", dueAt: "", notes: "",
  });

  // Detail / workflow
  const [detail, setDetail] = useState<RepairTicket | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState<any>({ lineType: "PART", productId: "", name: "", qty: "1", unitPrice: "" });
  const [estimateStep, setEstimateStep] = useState(false);
  const [estimateAmount, setEstimateAmount] = useState("");
  const [diagText, setDiagText] = useState("");
  const [deliverForm, setDeliverForm] = useState(false);
  const [payMethod, setPayMethod] = useState("CASH");

  const showMessage = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 3500); };

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (statusFilter) p.set("status", statusFilter);
      if (search) p.set("search", search);
      const res = await api.get<{ data: RepairTicket[] }>(`/v1/repair/tickets?${p}`);
      setTickets(res.data);
    } catch (err: any) { console.error(err); } finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const loadLookups = useCallback(async () => {
    const [c, p, s] = await Promise.all([
      api.get<{ data: CustomerOption[] }>("/v1/customers?limit=200").catch(() => ({ data: [] })),
      api.get<{ data: ProductOption[] }>("/v1/products?limit=200").catch(() => ({ data: [] })),
      api.get<{ data: StaffOption[] }>("/v1/salon/staff").catch(() => ({ data: [] })),
    ]);
    setCustomers(c.data); setProducts(p.data); setStaff(s.data);
  }, []);
  useEffect(() => { loadLookups(); }, [loadLookups]);

  async function openCreate() {
    await loadLookups();
    setTicketForm({ customerId: "", productId: "", serialNo: "", deviceInfo: "", reportedProblem: "", priority: "MEDIUM", technicianId: "", dueAt: "", notes: "" });
    setShowCreate(true);
  }

  async function createTicket() {
    if (!ticketForm.customerId) return;
    setSaving(true);
    try {
      const res = await api.post<{ id: string; warrantyEligible: boolean; warrantyType: string | null }>("/v1/repair/tickets", {
        customerId: ticketForm.customerId,
        productId: ticketForm.productId || undefined,
        serialNo: ticketForm.serialNo || undefined,
        deviceInfo: ticketForm.deviceInfo || undefined,
        reportedProblem: ticketForm.reportedProblem || undefined,
        priority: ticketForm.priority,
        technicianId: ticketForm.technicianId || undefined,
        dueAt: ticketForm.dueAt || undefined,
        notes: ticketForm.notes || undefined,
      });
      setShowCreate(false);
      showMessage(
        res.warrantyEligible
          ? `Ticket created — device is under warranty (${res.warrantyType})`
          : "Ticket created (Received)",
      );
      loadTickets();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function openDetail(t: RepairTicket) {
    const res = await api.get<{ data: RepairTicket }>(`/v1/repair/tickets/${t.id}`);
    setDetail(res.data);
    setDeliverForm(false); setEstimateStep(false);
    const items = res.data.items ?? [];
    const parts = items.filter((i) => i.lineType === "PART").reduce((s, i) => s + Number(i.lineTotal), 0);
    const labor = items.filter((i) => i.lineType === "LABOR").reduce((s, i) => s + Number(i.lineTotal), 0);
    setEstimateAmount(String(parts + labor));
    setDiagText(res.data.diagnosis ?? "");
  }

  async function addItem() {
    if (!detail) return;
    if (!itemForm.productId && !itemForm.name) return;
    setSaving(true);
    try {
      const prod = products.find((p) => p.id === itemForm.productId);
      await api.post(`/v1/repair/tickets/${detail.id}/items`, {
        lineType: itemForm.lineType,
        productId: itemForm.productId || undefined,
        name: itemForm.name || prod?.name,
        qty: Number(itemForm.qty) || 1,
        unitPrice: Number(itemForm.unitPrice) || Number(prod?.sellingPrice) || 0,
      });
      setShowAddItem(false);
      setItemForm({ lineType: "PART", productId: "", name: "", qty: "1", unitPrice: "" });
      openDetail(detail);
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function removeItem(itemId: string) {
    if (!detail) return;
    try {
      await api.del(`/v1/repair/tickets/${detail.id}/items/${itemId}`);
      openDetail(detail);
    } catch (err: any) { alert(err.message); }
  }

  async function transition(next: string) {
    if (!detail) return;
    setSaving(true);
    try {
      const body: any = {};
      if (next === "ESTIMATE") {
        body.estimatedCost = Number(estimateAmount) || detail.estimatedCost;
        body.diagnosis = diagText || undefined;
      }
      if (next === "REPAIRING") body.technicianId = detail.technicianId || undefined;
      await api.post(`/v1/repair/tickets/${detail.id}/status`, { status: next, ...body });
      showMessage(`Ticket → ${next}`);
      openDetail(detail);
      loadTickets();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function cancelTicket() {
    if (!detail || !confirm(`Cancel ticket ${detail.ticketNo}?`)) return;
    try {
      await api.post(`/v1/repair/tickets/${detail.id}/status`, { status: "CANCELLED" });
      setDetail(null);
      showMessage("Ticket cancelled");
      loadTickets();
    } catch (err: any) { alert(err.message); }
  }

  async function deliverTicket() {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await api.post<{ status: string; total: number; warrantyClaim: any }>(
        `/v1/repair/tickets/${detail.id}/status`, { status: "DELIVERED", paymentMethod: payMethod },
      );
      setDetail(null);
      setDeliverForm(false);
      showMessage(
        `Delivered — billed ${currency(res.total)}` +
        (res.warrantyClaim ? " · warranty claim filed ✓" : ""),
      );
      loadTickets();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  const itemTotals = (t: RepairTicket) => {
    const items = t.items ?? [];
    return {
      parts: items.filter((i) => i.lineType === "PART").reduce((s, i) => s + Number(i.lineTotal), 0),
      labor: items.filter((i) => i.lineType === "LABOR").reduce((s, i) => s + Number(i.lineTotal), 0),
    };
  };

  const byStatus = (s: string) => tickets.filter((t) => t.status === s);
  const counts: Record<string, number> = {};
  for (const t of tickets) counts[t.status] = (counts[t.status] ?? 0) + 1;

  const pipeline = ["RECEIVED", "INSPECTION", "ESTIMATE", "APPROVED", "REPAIRING", "QUALITY_CHECK", "READY", "DELIVERED"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Repair & Service Center</h1>
        <p className="mt-1 text-sm text-gray-500">Ticket lifecycle with spare parts, labour & warranty linkage (§11.8)</p>
      </div>

      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</div>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ticket no, serial, device, problem…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none" />
        </div>
        <CustomSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          options={[{ label: "All statuses", value: "" }, ...pipeline.map((s) => ({ label: s, value: s })), { label: "Cancelled", value: "CANCELLED" }]}
          containerClassName="w-44" />
        <CustomButton variant="outline" leftIcon={<RefreshCw size={15} />} onClick={loadTickets}>Refresh</CustomButton>
        <CustomButton leftIcon={<Plus size={15} />} onClick={openCreate}>New Ticket</CustomButton>
      </div>

      {/* Pipeline columns */}
      {loading ? (
        <div className="py-16 text-center"><Loader2 size={24} className="mx-auto animate-spin text-gray-300" /></div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8">
          {pipeline.map((st) => (
            <div key={st} className="min-h-[150px] rounded-xl border border-gray-100 bg-gray-50/40">
              <div className="flex items-center justify-between rounded-t-xl border-b border-gray-100 bg-white px-3 py-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGES[st] ?? ""}`}>{st}</span>
                <span className="text-xs font-semibold text-gray-400">{counts[st] ?? 0}</span>
              </div>
              <div className="space-y-2 p-2">
                {byStatus(st).map((t) => (
                  <button key={t.id} onClick={() => openDetail(t)}
                    className="w-full rounded-lg border border-gray-100 bg-white p-2.5 text-left shadow-sm transition hover:border-primary-200 hover:shadow">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-semibold text-gray-500">{t.ticketNo}</span>
                      {t.warrantyEligible ? <span title="Under warranty"><ShieldCheck size={11} className="text-emerald-500" /></span> : null}
                    </div>
                    <p className="mt-1 truncate text-xs font-semibold text-gray-800">{t.customerName || "Customer"}</p>
                    <p className="truncate text-[10px] text-gray-400">{t.deviceInfo || t.productName || t.serialNo || ""}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className={`rounded px-1.5 py-px text-[9px] font-semibold ${PRIORITY_STYLE[t.priority] ?? ""}`}>{t.priority}</span>
                      <span className="text-[10px] text-gray-400 tabular-nums">{currency(Number(t.estimatedCost || t.actualCost))}</span>
                    </div>
                  </button>
                ))}
                {byStatus(st).length === 0 && <p className="py-6 text-center text-[10px] text-gray-300">Empty</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create ticket modal */}
      <CustomModal open={showCreate} onClose={() => setShowCreate(false)} title="New Repair Ticket">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect label="Customer *" value={ticketForm.customerId} onChange={(e) => setTicketForm({ ...ticketForm, customerId: e.target.value })}
              placeholder="Select customer" options={customers.map((c) => ({ label: `${c.name}${c.phone ? ` · ${c.phone}` : ""}`, value: c.id }))} />
            <CustomSelect label="Priority" value={ticketForm.priority} onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
              options={["LOW", "MEDIUM", "HIGH", "URGENT"].map((x) => ({ label: x, value: x }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect label="Device product" value={ticketForm.productId} onChange={(e) => setTicketForm({ ...ticketForm, productId: e.target.value })}
              placeholder="Select product" options={products.map((p) => ({ label: `${p.name} (${p.sku})`, value: p.id }))} />
            <CustomInput label="Serial / IMEI" value={ticketForm.serialNo} onChange={(e) => setTicketForm({ ...ticketForm, serialNo: e.target.value })}
              placeholder="Checked against warranty automatically" />
          </div>
          <CustomInput label="Device info" value={ticketForm.deviceInfo} onChange={(e) => setTicketForm({ ...ticketForm, deviceInfo: e.target.value })} placeholder="e.g. Samsung Galaxy S24, cracked screen" />
          <CustomInput label="Reported problem" value={ticketForm.reportedProblem} onChange={(e) => setTicketForm({ ...ticketForm, reportedProblem: e.target.value })} placeholder="Describe the reported issue…" />
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect label="Technician" value={ticketForm.technicianId} onChange={(e) => setTicketForm({ ...ticketForm, technicianId: e.target.value })}
              placeholder="Assign later" options={staff.map((s) => ({ label: s.name, value: s.id }))} />
            <CustomInput label="Due date" type="date" value={ticketForm.dueAt} onChange={(e) => setTicketForm({ ...ticketForm, dueAt: e.target.value })} />
          </div>
          <CustomInput label="Notes" value={ticketForm.notes} onChange={(e) => setTicketForm({ ...ticketForm, notes: e.target.value })} />
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
            <AlertTriangle size={13} /> Enter the serial number to auto-detect warranty coverage on receipt.
          </div>
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowCreate(false)}>Cancel</CustomButton>
            <CustomButton loading={saving} onClick={createTicket} disabled={!ticketForm.customerId}>Create Ticket</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Detail modal */}
      <CustomModal open={!!detail} onClose={() => setDetail(null)} title={`Ticket ${detail?.ticketNo ?? ""}`}>
        {detail && (() => {
          const totals = itemTotals(detail);
          const flow = FLOW[detail.status];
          const canCancel = ["RECEIVED", "INSPECTION", "ESTIMATE", "APPROVED"].includes(detail.status);
          return (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_BADGES[detail.status] ?? ""}`}>{detail.status}</span>
                <span className={`rounded px-1.5 py-px text-[10px] font-semibold ${PRIORITY_STYLE[detail.priority] ?? ""}`}>{detail.priority}</span>
                {detail.warrantyEligible && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                    <ShieldCheck size={12} /> Under warranty{detail.warrantyType ? ` (${detail.warrantyType})` : ""}
                  </span>
                )}
                {detail.warrantyClaim && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Claim {detail.warrantyClaim.claimNo} — {detail.warrantyClaim.resolution}
                  </span>
                )}
                <span className="ml-auto text-xs text-gray-400">Received {new Date(detail.receivedAt).toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-gray-400">Customer</p><p className="font-medium">{detail.customerName} <span className="text-xs text-gray-400">{detail.customerPhone}</span></p></div>
                <div><p className="text-xs text-gray-400">Technician</p><p className="font-medium">{detail.technicianName || "—"}</p></div>
                <div><p className="text-xs text-gray-400">Device</p><p className="font-medium">{detail.productName || "—"}{detail.serialNo ? ` · ${detail.serialNo}` : ""}</p></div>
                <div><p className="text-xs text-gray-400">Problem</p><p className="font-medium">{detail.reportedProblem || "—"}</p></div>
              </div>
              {detail.diagnosis && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm"><p className="text-xs font-semibold text-gray-500">Diagnosis</p><p className="mt-0.5 text-gray-700">{detail.diagnosis}</p></div>
              )}

              {/* Estimate step */}
              {detail.status === "INSPECTION" && (
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                  <p className="mb-2 text-xs font-semibold text-amber-700">Move to ESTIMATE — set the estimated cost & diagnosis:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <CustomInput label="Estimated cost (৳)" type="number" min={0} value={estimateAmount} onChange={(e) => setEstimateAmount(e.target.value)} />
                    <CustomInput label="Diagnosis" value={diagText} onChange={(e) => setDiagText(e.target.value)} placeholder="Findings…" />
                  </div>
                </div>
              )}

              {/* Parts & labour */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Parts & labour</p>
                  <div className="flex gap-2">
                    {detail.status !== "DELIVERED" && detail.status !== "CANCELLED" && (
                      <CustomButton size="sm" variant="outline" leftIcon={<Plus size={13} />} onClick={() => { setItemForm({ lineType: "PART", productId: "", name: "", qty: "1", unitPrice: "" }); setShowAddItem(true); }}>Add line</CustomButton>
                    )}
                  </div>
                </div>
                {(detail.items ?? []).length === 0 ? (
                  <p className="rounded-lg border-2 border-dashed border-gray-100 p-6 text-center text-xs text-gray-400">No parts or labour lines yet</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr><th className="px-3 py-2">Type</th><th className="px-3 py-2">Item</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Unit</th><th className="px-3 py-2 text-right">Total</th>{detail.status !== "DELIVERED" && detail.status !== "CANCELLED" ? <th className="px-3 py-2" /> : null}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(detail.items ?? []).map((i) => (
                          <tr key={i.id}>
                            <td className="px-3 py-2"><span className={`rounded px-1.5 py-px text-[10px] font-semibold ${i.lineType === "PART" ? "bg-indigo-50 text-indigo-600" : i.lineType === "LABOR" ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"}`}>{i.lineType}</span></td>
                            <td className="px-3 py-2 font-medium">{i.name}</td>
                            <td className="px-3 py-2 tabular-nums">{i.qty}</td>
                            <td className="px-3 py-2 tabular-nums">{currency(Number(i.unitPrice))}</td>
                            <td className="px-3 py-2 text-right font-semibold tabular-nums">{currency(Number(i.lineTotal))}</td>
                            {detail.status !== "DELIVERED" && detail.status !== "CANCELLED" && (
                              <td className="px-3 py-2 text-right"><button onClick={() => removeItem(i.id)} className="text-gray-300 hover:text-rose-500"><Trash2 size={13} /></button></td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-2 flex justify-end gap-6 text-sm">
                  <span className="text-gray-500">Parts <b className="tabular-nums">{currency(totals.parts)}</b></span>
                  <span className="text-gray-500">Labour <b className="tabular-nums">{currency(totals.labor)}</b></span>
                  <span className="font-bold text-gray-900">Total <span className="tabular-nums">{currency(totals.parts + totals.labor)}</span></span>
                </div>
              </div>

              {/* Action row */}
              <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                {flow && (
                  <CustomButton leftIcon={<ArrowRight size={14} />} onClick={() => {
                    if (detail.status === "READY") setDeliverForm(true);
                    else transition(flow.next);
                  }}>
                    {detail.status === "READY" ? "Deliver & Bill" : flow.label}
                  </CustomButton>
                )}
                {canCancel && (
                  <CustomButton variant="outline" onClick={cancelTicket} className="!text-rose-500">Cancel ticket</CustomButton>
                )}
                {detail.status === "DELIVERED" && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 size={14} /> Delivered · billed {currency(Number(detail.actualCost))}</span>
                  </div>
                )}
                <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
                  {detail.warrantyClaim ? (
                    <span className="flex items-center gap-1 text-emerald-600"><ShieldCheck size={13} /> Warranty claim {detail.warrantyClaim.claimNo} ({detail.warrantyClaim.status})</span>
                  ) : detail.warrantyEligible ? (
                    <span className="flex items-center gap-1"><ShieldCheck size={13} /> Warranty claim filed on delivery</span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })()}
      </CustomModal>

      {/* Add item modal */}
      <CustomModal open={showAddItem} onClose={() => setShowAddItem(false)} title="Add Part / Labour Line">
        <div className="space-y-4">
          <CustomSelect label="Line type" value={itemForm.lineType} onChange={(e) => setItemForm({ ...itemForm, lineType: e.target.value })}
            options={[{ label: "Spare part", value: "PART" }, { label: "Labour", value: "LABOR" }, { label: "Other", value: "OTHER" }]} />
          {itemForm.lineType === "PART" ? (
            <CustomSelect label="Spare part product" value={itemForm.productId} onChange={(e) => {
              setItemForm({ ...itemForm, productId: e.target.value });
              const p = products.find((x) => x.id === e.target.value);
              if (p) setItemForm((f: any) => ({ ...f, productId: e.target.value, name: p.name, unitPrice: String(p.sellingPrice || "") }));
            }} placeholder="Select product (consumed from stock)" options={products.map((p) => ({ label: `${p.name} — ${currency(Number(p.sellingPrice))}`, value: p.id }))} />
          ) : (
            <CustomInput label="Description" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="e.g. Labour — screen replacement" />
          )}
          <div className="grid grid-cols-2 gap-3">
            <CustomInput label="Qty" type="number" min={0} value={itemForm.qty} onChange={(e) => setItemForm({ ...itemForm, qty: e.target.value })} />
            <CustomInput label="Unit price (৳)" type="number" min={0} value={itemForm.unitPrice} onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowAddItem(false)}>Cancel</CustomButton>
            <CustomButton loading={saving} onClick={addItem} disabled={(!itemForm.productId && !itemForm.name)}>Add</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Deliver modal */}
      <CustomModal open={deliverForm} onClose={() => setDeliverForm(false)} title={`Deliver & Bill — ${detail?.ticketNo ?? ""}`}>
        {detail && (() => {
          const items = detail.items ?? [];
          const parts = items.filter((i) => i.lineType === "PART").reduce((s, i) => s + Number(i.lineTotal), 0);
          const labor = items.filter((i) => i.lineType === "LABOR").reduce((s, i) => s + Number(i.lineTotal), 0);
          return (<div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="flex justify-between"><span className="text-gray-500">Parts</span><span className="tabular-nums">{currency(parts)}</span></p>
              <p className="mt-1 flex justify-between"><span className="text-gray-500">Labour</span><span className="tabular-nums">{currency(labor)}</span></p>
              <p className="mt-1 flex justify-between font-bold"><span>Total</span><span className="tabular-nums">{currency(parts + labor)}</span></p>
            </div>
            <CustomSelect label="Payment method" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
              options={[{ label: "Cash", value: "CASH" }, { label: "Card", value: "CARD" }, { label: "bKash", value: "BKASH" }, { label: "Customer credit", value: "CREDIT" }]} />
            <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
              {detail.warrantyEligible && !detail.warrantyClaim
                ? <>Spare parts leave stock, the repair is billed, and a <b>warranty claim</b> is filed automatically.</>
                : <>Spare parts leave stock and the repair is billed (sale + invoice + payment + journal).</>}
            </div>
            <div className="flex justify-end gap-2">
              <CustomButton variant="outline" onClick={() => setDeliverForm(false)}>Cancel</CustomButton>
              <CustomButton loading={saving} onClick={deliverTicket} leftIcon={<CreditCard size={15} />}>Deliver & Bill</CustomButton>
            </div>
          </div>);
        })()}
      </CustomModal>
    </div>
  );
}