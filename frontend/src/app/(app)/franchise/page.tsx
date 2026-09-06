"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Handshake, Plus, RefreshCw, Loader2, MapPin, Calculator, CheckCircle2,
  BadgeCheck, Wallet, Eye, Trash2, Store, Percent,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";

interface Franchisee {
  id: string;
  franchiseNo: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  territory: string | null;
  openingFee: number;
  royaltyRatePct: number;
  commissionRatePct: number;
  contractStart: string | null;
  contractEnd: string | null;
  status: string;
  branches: { branchId: string; branchName: string; warehouseName: string | null }[];
}

interface Branch { id: string; name: string; }
interface Warehouse { id: string; name: string; branchId: string; }

interface Settlement {
  id: string;
  settlementNo: string;
  franchiseId: string;
  franchiseName?: string;
  periodStart: string;
  periodEnd: string;
  grossSales: number;
  returnsTotal: number;
  netSales: number;
  royaltyRatePct: number;
  royaltyAmount: number;
  feeAmount: number;
  commissionAmount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const currency = (v: number) => `৳${v.toLocaleString("en-BD", { minimumFractionDigits: 2 })}`;

const STATUS_BADGES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  SUSPENDED: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  TERMINATED: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  DRAFT: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  APPROVED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  PAID: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  CANCELLED: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

export default function FranchisePage() {
  const [tab, setTab] = useState<"franchisees" | "settlements">("franchisees");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Franchisees
  const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
  const [frLoading, setFrLoading] = useState(false);
  const [showFr, setShowFr] = useState(false);
  const [frForm, setFrForm] = useState<any>({
    name: "", contactPerson: "", phone: "", email: "", territory: "",
    openingFee: "", royaltyRatePct: "5", commissionRatePct: "0", contractStart: "", contractEnd: "",
  });
  const [linkTarget, setLinkTarget] = useState<Franchisee | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [branchSel, setBranchSel] = useState<Record<string, string>>({});
  const [report, setReport] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);

  // Settlements
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [stLoading, setStLoading] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [calcForm, setCalcForm] = useState<any>({
    franchiseId: "", periodStart: "", periodEnd: "",
    royaltyRatePct: "", commissionRatePct: "", includeOpeningFee: true,
  });
  const [preview, setPreview] = useState<any>(null);
  const [detailSettlement, setDetailSettlement] = useState<any>(null);

  const showMessage = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 3500); };

  const loadFranchisees = useCallback(async () => {
    setFrLoading(true);
    try {
      const res = await api.get<{ data: Franchisee[] }>("/v1/franchise/franchisees");
      setFranchisees(res.data);
    } catch (err: any) { console.error(err); } finally { setFrLoading(false); }
  }, []);

  const loadSettlements = useCallback(async () => {
    setStLoading(true);
    try {
      const res = await api.get<{ data: Settlement[] }>("/v1/franchise/settlements");
      setSettlements(res.data);
    } catch (err: any) { console.error(err); } finally { setStLoading(false); }
  }, []);

  useEffect(() => { loadFranchisees(); loadSettlements(); }, [loadFranchisees, loadSettlements]);

  useEffect(() => {
    api.get<{ data: Branch[] }>("/v1/branches").then((r) => setBranches(r.data)).catch(() => setBranches([]));
    api.get<{ data: Warehouse[] }>("/v1/warehouses").then((r) => setWarehouses(r.data)).catch(() => setWarehouses([]));
  }, []);

  async function createFranchisee() {
    if (!frForm.name) return;
    setSaving(true);
    try {
      await api.post("/v1/franchise/franchisees", {
        name: frForm.name,
        contactPerson: frForm.contactPerson || undefined,
        phone: frForm.phone || undefined,
        email: frForm.email || undefined,
        territory: frForm.territory || undefined,
        openingFee: Number(frForm.openingFee) || 0,
        royaltyRatePct: Number(frForm.royaltyRatePct) || 5,
        commissionRatePct: Number(frForm.commissionRatePct) || 0,
        contractStart: frForm.contractStart || undefined,
        contractEnd: frForm.contractEnd || undefined,
      });
      setShowFr(false);
      setFrForm({ name: "", contactPerson: "", phone: "", email: "", territory: "", openingFee: "", royaltyRatePct: "5", commissionRatePct: "0", contractStart: "", contractEnd: "" });
      showMessage("Franchisee created");
      loadFranchisees();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function openLink(f: Franchisee) {
    setLinkTarget(f);
    setBranchSel({});
    setShowReport(false);
  }

  async function saveLinks() {
    if (!linkTarget) return;
    setSaving(true);
    try {
      const links = Object.entries(branchSel).filter(([bid, wid]) => wid !== "").map(([bid, wid]) => ({ branchId: bid, warehouseId: wid || undefined }));
      const bare = Object.keys(branchSel).filter((bid) => branchSel[bid] === "");
      if (links.length === 0 && bare.length === 0) { setLinkTarget(null); return; }
      const all = [...links, ...bare.map((bid) => ({ branchId: bid }))];
      await api.post(`/v1/franchise/franchisees/${linkTarget.id}/branches`, { branches: all });
      setLinkTarget(null);
      showMessage("Branches linked to franchise");
      loadFranchisees();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function unlinkBranch(f: Franchisee, branchId: string) {
    if (!confirm(`Unlink branch from ${f.name}?`)) return;
    try { await api.del(`/v1/franchise/franchisees/${f.id}/branches/${branchId}`); loadFranchisees(); }
    catch (err: any) { alert(err.message); }
  }

  async function openReport(f: Franchisee) {
    const res = await api.get<any>(`/v1/franchise/franchisees/${f.id}/report`);
    setReport(res);
    setShowReport(true);
  }

  async function openCalc() {
    await loadFranchisees();
    const now = new Date();
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    setCalcForm({
      franchiseId: franchisees[0]?.id ?? "",
      periodStart: start, periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
      royaltyRatePct: "", commissionRatePct: "", includeOpeningFee: true,
    });
    setPreview(null);
    setShowCalc(true);
  }

  async function calculate() {
    if (!calcForm.franchiseId || !calcForm.periodStart || !calcForm.periodEnd) return;
    setSaving(true);
    try {
      const res = await api.post<any>("/v1/franchise/settlements/calculate", {
        franchiseId: calcForm.franchiseId,
        periodStart: calcForm.periodStart, periodEnd: calcForm.periodEnd,
        royaltyRatePct: calcForm.royaltyRatePct ? Number(calcForm.royaltyRatePct) : undefined,
        commissionRatePct: calcForm.commissionRatePct ? Number(calcForm.commissionRatePct) : undefined,
        includeOpeningFee: calcForm.includeOpeningFee,
      });
      setPreview(res);
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function saveSettlement() {
    if (!preview) return;
    setSaving(true);
    try {
      await api.post("/v1/franchise/settlements", {
        franchiseId: preview.franchiseId,
        periodStart: preview.periodStart, periodEnd: preview.periodEnd,
        royaltyRatePct: preview.royaltyRatePct,
        commissionRatePct: preview.commissionRatePct,
        includeOpeningFee: calcForm.includeOpeningFee,
        notes: "Auto settlement",
      });
      setShowCalc(false); setPreview(null);
      showMessage("Settlement saved (DRAFT)");
      loadSettlements();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function setSettlementStatus(s: Settlement, status: string) {
    try {
      await api.post(`/v1/franchise/settlements/${s.id}/status`, { status });
      showMessage(`Settlement ${status}`);
      loadSettlements();
    } catch (err: any) { alert(err.message); }
  }

  async function openSettlementDetail(s: Settlement) {
    setDetailSettlement(s);
  }

  const monthlyTotal = settlements.filter((s) => s.status !== "CANCELLED").reduce((a, s) => a + Number(s.totalAmount), 0);
  const paidTotal = settlements.filter((s) => s.status === "PAID").reduce((a, s) => a + Number(s.totalAmount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Franchise Management</h1>
        <p className="mt-1 text-sm text-gray-500">Franchisees, royalty & settlement engine across franchise branches (§10.30)</p>
      </div>

      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</div>}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Active franchisees" value={String(franchisees.filter((f) => f.status === "ACTIVE").length)} icon={<Handshake size={16} />} color="bg-blue-50 text-blue-600" />
        <Stat label="Settlement value" value={currency(monthlyTotal)} icon={<Calculator size={16} />} color="bg-purple-50 text-purple-600" />
        <Stat label="Paid to date" value={currency(paidTotal)} icon={<Wallet size={16} />} color="bg-emerald-50 text-emerald-600" />
        <Stat label="Avg royalty rate" value={franchisees.length ? `${Math.round(franchisees.reduce((s, f) => s + Number(f.royaltyRatePct), 0) / franchisees.length * 10) / 10}%` : "—"} icon={<Percent size={16} />} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {([["franchisees", "Franchisees", Store], ["settlements", "Settlements", Calculator]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${tab === key ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {tab === "franchisees" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{franchisees.length} franchise partner(s)</p>
            <CustomButton leftIcon={<Plus size={15} />} onClick={() => setShowFr(true)}>Add Franchisee</CustomButton>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {frLoading ? (
              <div className="col-span-full py-12 text-center"><Loader2 size={22} className="mx-auto animate-spin text-gray-300" /></div>
            ) : franchisees.length === 0 ? (
              <div className="col-span-full rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">No franchisees yet — add your first franchise partner</div>
            ) : franchisees.map((f) => (
              <div key={f.id} className="rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Store size={18} /></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{f.name}</p>
                      <p className="text-[10px] text-gray-400">{f.franchiseNo}{f.territory ? ` · ${f.territory}` : ""}</p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_BADGES[f.status] ?? ""}`}>{f.status}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-gray-50 py-1.5">
                    <p className="text-xs font-bold text-primary-600 tabular-nums">{f.royaltyRatePct}%</p>
                    <p className="text-[9px] text-gray-400">ROYALTY</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 py-1.5">
                    <p className="text-xs font-bold text-gray-700 tabular-nums">{f.commissionRatePct}%</p>
                    <p className="text-[9px] text-gray-400">COMMISSION</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 py-1.5">
                    <p className="text-xs font-bold text-gray-700 tabular-nums">{f.branches.length}</p>
                    <p className="text-[9px] text-gray-400">BRANCHES</p>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {f.branches.map((b) => (
                    <p key={b.branchId} className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {b.branchName}</span>
                      <button onClick={() => unlinkBranch(f, b.branchId)} className="text-gray-300 hover:text-rose-500" title="Unlink">✕</button>
                    </p>
                  ))}
                  {f.branches.length === 0 && <p className="text-xs text-amber-600">No branches linked yet</p>}
                </div>
                <div className="mt-3 flex gap-2 border-t border-gray-50 pt-2.5">
                  <CustomButton size="sm" variant="outline" onClick={() => openLink(f)} leftIcon={<MapPin size={13} />}>Link branches</CustomButton>
                  <CustomButton size="sm" variant="outline" onClick={() => openReport(f)} leftIcon={<Eye size={13} />}>Report</CustomButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "settlements" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Royalty & fee settlements computed from each franchise branch's confirmed sales</p>
            <CustomButton leftIcon={<Calculator size={15} />} onClick={openCalc}>Calculate Settlement</CustomButton>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Settlement</th><th className="px-4 py-3">Franchisee</th><th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Net sales</th><th className="px-4 py-3">Royalty</th><th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stLoading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-300" /></td></tr>
                ) : settlements.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No settlements yet — calculate one for a franchise</td></tr>
                ) : settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs">{s.settlementNo}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.franchiseName}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.periodStart} → {s.periodEnd}</td>
                    <td className="px-4 py-3 tabular-nums">{currency(Number(s.netSales))}</td>
                    <td className="px-4 py-3 tabular-nums text-blue-600">{currency(Number(s.royaltyAmount))}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{currency(Number(s.totalAmount))}</td>
                    <td className="px-4 py-3"><span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_BADGES[s.status] ?? ""}`}>{s.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button title="Detail" onClick={() => openSettlementDetail(s)} className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"><Eye size={14} /></button>
                        {s.status === "DRAFT" && <button title="Approve" onClick={() => setSettlementStatus(s, "APPROVED")} className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"><BadgeCheck size={14} /></button>}
                        {s.status === "APPROVED" && <button title="Mark paid" onClick={() => setSettlementStatus(s, "PAID")} className="rounded p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600"><CheckCircle2 size={14} /></button>}
                        {s.status === "DRAFT" && <button title="Cancel" onClick={() => setSettlementStatus(s, "CANCELLED")} className="rounded p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add franchisee modal */}
      <CustomModal open={showFr} onClose={() => setShowFr(false)} title="Add Franchisee">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <CustomInput label="Franchise name *" value={frForm.name} onChange={(e) => setFrForm({ ...frForm, name: e.target.value })} />
            <CustomInput label="Territory / area" value={frForm.territory} onChange={(e) => setFrForm({ ...frForm, territory: e.target.value })} />
            <CustomInput label="Contact person" value={frForm.contactPerson} onChange={(e) => setFrForm({ ...frForm, contactPerson: e.target.value })} />
            <CustomInput label="Phone" value={frForm.phone} onChange={(e) => setFrForm({ ...frForm, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <CustomInput label="Opening fee (৳)" type="number" min={0} value={frForm.openingFee} onChange={(e) => setFrForm({ ...frForm, openingFee: e.target.value })} />
            <CustomInput label="Royalty rate (%)" type="number" min={0} max={100} value={frForm.royaltyRatePct} onChange={(e) => setFrForm({ ...frForm, royaltyRatePct: e.target.value })} />
            <CustomInput label="Commission rate (%)" type="number" min={0} max={100} value={frForm.commissionRatePct} onChange={(e) => setFrForm({ ...frForm, commissionRatePct: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CustomInput label="Contract start" type="date" value={frForm.contractStart} onChange={(e) => setFrForm({ ...frForm, contractStart: e.target.value })} />
            <CustomInput label="Contract end" type="date" value={frForm.contractEnd} onChange={(e) => setFrForm({ ...frForm, contractEnd: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowFr(false)}>Cancel</CustomButton>
            <CustomButton loading={saving} onClick={createFranchisee} disabled={!frForm.name}>Create</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Link branches modal */}
      <CustomModal open={!!linkTarget && !showReport} onClose={() => setLinkTarget(null)} title={`Link branches — ${linkTarget?.name ?? ""}`}>
        {linkTarget && (
          <div className="space-y-4">
            {branches.map((b) => {
              const already = linkTarget.branches.some((x) => x.branchId === b.id);
              const wid = branchSel[b.id] ?? "";
              return (
                <div key={b.id} className={`rounded-lg border p-3 ${already ? "border-gray-100 bg-gray-50 opacity-60" : "border-gray-100"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">{b.name}</p>
                    {already && <span className="text-xs text-gray-400">linked</span>}
                  </div>
                  {!already && (
                    <CustomSelect containerClassName="mt-2" placeholder="Warehouse (optional)" value={wid}
                      onChange={(e) => setBranchSel({ ...branchSel, [b.id]: e.target.value })}
                      options={warehouses.filter((w) => w.branchId === b.id).map((w) => ({ label: w.name, value: w.id }))} />
                  )}
                </div>
              );
            })}
            <div className="flex justify-end gap-2">
              <CustomButton variant="outline" onClick={() => setLinkTarget(null)}>Cancel</CustomButton>
              <CustomButton loading={saving} onClick={saveLinks}>Link branches</CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Calculate settlement modal */}
      <CustomModal open={showCalc} onClose={() => setShowCalc(false)} title="Calculate Franchise Settlement">
        <div className="space-y-4">
          <CustomSelect label="Franchisee" value={calcForm.franchiseId} onChange={(e) => setCalcForm({ ...calcForm, franchiseId: e.target.value })}
            placeholder="Select franchisee" options={franchisees.map((f) => ({ label: `${f.name} (${f.branches.length} branches)`, value: f.id }))} />
          <div className="grid grid-cols-2 gap-3">
            <CustomInput label="Period start" type="date" value={calcForm.periodStart} onChange={(e) => setCalcForm({ ...calcForm, periodStart: e.target.value })} />
            <CustomInput label="Period end" type="date" value={calcForm.periodEnd} onChange={(e) => setCalcForm({ ...calcForm, periodEnd: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CustomInput label="Royalty rate % (default from franchise)" type="number" min={0} max={100} value={calcForm.royaltyRatePct} onChange={(e) => setCalcForm({ ...calcForm, royaltyRatePct: e.target.value })} />
            <CustomInput label="Commission rate % (default from franchise)" type="number" min={0} max={100} value={calcForm.commissionRatePct} onChange={(e) => setCalcForm({ ...calcForm, commissionRatePct: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={calcForm.includeOpeningFee} onChange={(e) => setCalcForm({ ...calcForm, includeOpeningFee: e.target.checked })} className="rounded border-gray-300" />
            Include opening fee in the first settlement
          </label>
          <CustomButton onClick={calculate} loading={saving} disabled={!calcForm.franchiseId || !calcForm.periodStart || !calcForm.periodEnd}>Calculate preview</CustomButton>

          {preview && (
            <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">{preview.franchiseName}</p>
                <p className="text-xs text-gray-400">{preview.branchCount} branch(es) · {preview.periodStart} → {preview.periodEnd}</p>
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                <Row k="Gross sales" v={currency(preview.grossSales)} />
                <Row k="Returns" v={`− ${currency(preview.returnsTotal)}`} tone="text-rose-600" />
                <Row k="Net sales" v={currency(preview.netSales)} strong />
                <div className="border-t border-gray-200 pt-1.5" />
                <Row k={`Royalty (${preview.royaltyRatePct}%)`} v={currency(preview.royaltyAmount)} tone="text-blue-600" />
                <Row k="Opening fee" v={currency(preview.feeAmount)} />
                {preview.commissionAmount > 0 && <Row k={`Commission (${preview.commissionRatePct}%)`} v={currency(preview.commissionAmount)} />}
                <Row k="Total due to HQ" v={currency(preview.totalAmount)} strong tone="text-emerald-600" />
              </div>
              <div className="mt-3 space-y-1 border-t border-gray-100 pt-2">
                {preview.lines.map((l: any) => (
                  <p key={l.branchId} className="flex justify-between text-xs text-gray-500">
                    <span>{l.branchName}</span>
                    <span className="tabular-nums">{currency(Number(l.netSales))} net · {currency(Number(l.royaltyAmount))} royalty</span>
                  </p>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowCalc(false)}>Close</CustomButton>
            {preview && <CustomButton loading={saving} onClick={saveSettlement} leftIcon={<CheckCircle2 size={15} />}>Save Settlement</CustomButton>}
          </div>
        </div>
      </CustomModal>

      {/* Franchise report modal */}
      <CustomModal open={showReport} onClose={() => setShowReport(false)} title={`Report — ${report?.name ?? ""}`}>
        {report && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-gray-400">Franchise no</p><p className="font-medium font-mono text-xs">{report.franchiseNo}</p></div>
              <div><p className="text-xs text-gray-400">Contact</p><p className="font-medium">{report.contactPerson || "—"}</p></div>
              <div><p className="text-xs text-gray-400">Territory</p><p className="font-medium">{report.territory || "—"}</p></div>
              <div><p className="text-xs text-gray-400">Status</p><p className="font-medium">{report.status}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Total sales (all branches)" value={currency(Number(report.totalSales))} icon={<Store size={16} />} color="bg-blue-50 text-blue-600" />
              <Stat label="Royalty settled" value={currency(Number(report.settledRoyalty))} icon={<Wallet size={16} />} color="bg-emerald-50 text-emerald-600" />
            </div>
            <div className="rounded-lg border border-gray-100 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Branches</p>
              {report.branches.length === 0 && <p className="text-xs text-gray-400">No branches linked</p>}
              {report.branches.map((b: any) => <p key={b.branchId} className="flex items-center gap-1.5 text-sm text-gray-700"><MapPin size={12} className="text-gray-300" /> {b.branchName}</p>)}
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="flex justify-between"><span className="text-gray-500">Royalty rate</span><span className="font-semibold">{report.royaltyRatePct}%</span></p>
              <p className="mt-1 flex justify-between"><span className="text-gray-500">Opening fee</span><span className="tabular-nums">{currency(Number(report.openingFee))}</span></p>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Settlement detail modal */}
      <CustomModal open={!!detailSettlement} onClose={() => setDetailSettlement(null)} title={`Settlement ${detailSettlement?.settlementNo ?? ""}`}>
        {detailSettlement && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-400">Franchisee</p><p className="font-medium">{detailSettlement.franchiseName}</p></div>
              <div><p className="text-xs text-gray-400">Period</p><p className="font-medium">{detailSettlement.periodStart} → {detailSettlement.periodEnd}</p></div>
              <div><p className="text-xs text-gray-400">Status</p><p className="font-medium">{detailSettlement.status}</p></div>
              <div><p className="text-xs text-gray-400">Royalty rate</p><p className="font-medium">{detailSettlement.royaltyRatePct}%</p></div>
            </div>
            <div className="space-y-1.5 rounded-lg bg-gray-50 p-3 text-sm">
              <Row k="Gross sales" v={currency(Number(detailSettlement.grossSales))} />
              <Row k="Returns" v={`− ${currency(Number(detailSettlement.returnsTotal))}`} tone="text-rose-600" />
              <Row k="Net sales" v={currency(Number(detailSettlement.netSales))} strong />
              <div className="border-t border-gray-200 pt-1" />
              <Row k="Royalty" v={currency(Number(detailSettlement.royaltyAmount))} tone="text-blue-600" />
              <Row k="Fees" v={currency(Number(detailSettlement.feeAmount))} />
              <Row k="Commission" v={currency(Number(detailSettlement.commissionAmount))} />
              <Row k="Total" v={currency(Number(detailSettlement.totalAmount))} strong tone="text-emerald-600" />
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
}

function Row({ k, v, strong, tone }: { k: string; v: string; strong?: boolean; tone?: string }) {
  return (
    <p className={`flex justify-between ${strong ? "font-bold" : ""}`}>
      <span className={strong ? "text-gray-800" : "text-gray-500"}>{k}</span>
      <span className={`tabular-nums ${tone ?? (strong ? "text-gray-900" : "text-gray-600")}`}>{v}</span>
    </p>
  );
}

function Stat({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900 tabular-nums">{value}</p>
      </div>
    </div>
  );
}