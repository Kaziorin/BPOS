"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2, XCircle, ArrowUpRight, Ban, RefreshCw, Search, Loader2,
  GitMerge, Layers, Inbox, FileCheck2, Clock, Settings,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";

interface ApprovalRow {
  id: string; requestNo: string; entityType: string; entityLabel?: string;
  entityNo?: string | null; summary?: string | null; amount: number;
  status: string; currentLevel: number; currentRole?: string | null;
  totalLevels?: number; approvedLevels?: number; submittedBy?: string | null;
  createdAt: string; expiresAt?: string | null; payload?: any;
}
interface StepRow { id: string; level: number; role?: string | null; status: string; comment?: string | null; actedBy?: string | null; actedAt?: string | null; }

const ENTITIES: [string, string][] = [
  ["PRICE_CHANGE", "Catalog price change"],
  ["STOCK_ADJUST", "Stock adjustment"],
  ["PRICE_OVERRIDE", "POS price override"],
  ["CREDIT_LIMIT", "Customer credit limit"],
  ["CREDIT_HOLD", "Customer credit hold"],
  ["PURCHASE_ORDER", "Purchase order"],
  ["PURCHASE_REQUISITION", "Purchase requisition"],
  ["EXPENSE", "Expense"],
  ["SHIFT_CLOSE", "Shift close variance"],
  ["TASK", "Task approval"],
  ["SALE_DISCOUNT", "Discount / price override"],
];

const STATUS_CHIP: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700",
  APPROVED: "bg-emerald-500/10 text-emerald-700",
  REJECTED: "bg-rose-500/10 text-rose-700",
  ESCALATED: "bg-sky-500/10 text-sky-700",
  CANCELLED: "bg-gray-500/10 text-gray-500",
  EXPIRED: "bg-gray-500/10 text-gray-500",
};
const STEP_CHIP: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-500",
  APPROVED: "bg-emerald-500/10 text-emerald-700",
  REJECTED: "bg-rose-500/10 text-rose-700",
  ESCALATED: "bg-sky-500/10 text-sky-700",
};

const taka = (v: any) => `৳${(Number(v) || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`;
const fmtDt = (v?: string | null) => (v ? new Date(v).toLocaleString("en-GB") : "—");

export default function ApprovalCenter({
  mine = false,
  defaultStatus = "",
  onNeedRules,
}: {
  mine?: boolean;
  defaultStatus?: string;
  onNeedRules?: () => void;
}) {
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(defaultStatus);
  const [entity, setEntity] = useState("");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [act, setAct] = useState<{ kind: "approve" | "reject" | "escalate" | "cancel"; row: ApprovalRow } | null>(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const show = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (mine) q.set("mine", "1");
      const res = await api.get<{ data: ApprovalRow[] }>(`/v1/approvals?${q.toString()}`);
      setRows(res.data);
    } catch (err: any) { console.error(err); }
    finally { setLoading(false); }
  }, [mine]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (status && r.status !== status) return false;
    if (entity && r.entityType !== entity) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${r.requestNo} ${r.entityLabel ?? ""} ${r.summary ?? ""} ${r.entityNo ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [rows, status, entity, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [rows]);
  const pending = counts.PENDING || 0;
  const totalAmt = filtered.filter((r) => r.status === "PENDING").reduce((s, r) => s + Number(r.amount || 0), 0);

  async function openDetail(row: ApprovalRow) {
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await api.get<{ data: any }>(`/v1/approvals/${row.id}`);
      setDetail(res.data);
    } catch (err: any) { alert(err?.message || "Failed to load"); }
    finally { setDetailLoading(false); }
  }

  async function runAction() {
    if (!act) return;
    if (act.kind !== "cancel" && !comment.trim() && act.kind !== "approve" && act.kind !== "escalate") {
      alert("A comment is required");
      return;
    }
    setBusyId(act.row.id);
    try {
      const ep = `/v1/approvals/${act.row.id}/${act.kind}`;
      const body = act.kind === "cancel" ? { reason: comment } : { comment };
      const res = await api.post<{ data: any }>(ep, body);
      show(`Request ${res.data?.requestNo ?? ""} → ${res.data?.status ?? act.kind}`);
      setAct(null); setComment("");
      load();
    } catch (err: any) { alert(err?.message || "Action failed"); }
    finally { setBusyId(null); }
  }

  async function sweepTimeouts() {
    try {
      const res = await api.post<{ data: any }>("/v1/approvals/sweep-timeouts", {});
      show(`Timeout sweep — ${res.data?.escalated ?? 0} escalated, ${res.data?.finalized ?? 0} expired`);
      load();
    } catch (err: any) { alert(err?.message || "Sweep failed"); }
  }

  const ActionBtn = ({ row }: { row: ApprovalRow }) => (
    <div className="flex items-center justify-end gap-1.5">
      <button onClick={() => openDetail(row)} className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200">View</button>
      {row.status === "PENDING" && (
        <>
          <button onClick={() => { setAct({ kind: "approve", row }); setComment(""); }} className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100">Approve</button>
          <button onClick={() => { setAct({ kind: "reject", row }); setComment(""); }} className="rounded-md bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100">Reject</button>
          <button onClick={() => { setAct({ kind: "escalate", row }); setComment(""); }} className="rounded-md bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700 hover:bg-sky-100">Escalate</button>
          <button onClick={() => { setAct({ kind: "cancel", row }); setComment(""); }} className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-200">Cancel</button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <GitMerge size={22} className="text-primary-600" />
            {mine ? "My submissions" : "Approval Center"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Every price / stock / credit / expense / purchase / task change runs through one configurable workflow engine
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CustomButton variant="outline" onClick={sweepTimeouts}><Clock size={14} /> Sweep timeouts</CustomButton>
          <CustomButton variant="outline" onClick={load}><RefreshCw size={14} /> Refresh</CustomButton>
          {onNeedRules && <CustomButton onClick={onNeedRules}><Settings size={14} /> Workflow rules</CustomButton>}
        </div>
      </div>

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Inbox size={13} /> Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{pending}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Layers size={13} /> Total requests</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><FileCheck2 size={13} /> Approved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{counts.APPROVED || 0}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><XCircle size={13} /> Rejected</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{counts.REJECTED || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <CustomSelect value={status} onChange={(e) => setStatus(e.target.value)}
          options={[{ value: "", label: "All statuses" }, { value: "PENDING", label: "Pending" }, { value: "APPROVED", label: "Approved" }, { value: "REJECTED", label: "Rejected" }, { value: "ESCALATED", label: "Escalated" }, { value: "CANCELLED", label: "Cancelled" }, { value: "EXPIRED", label: "Expired" }]}
          containerClassName="w-40" />
        <CustomSelect value={entity} onChange={(e) => setEntity(e.target.value)}
          options={[{ value: "", label: "All entity types" }, ...ENTITIES.map(([v, l]) => ({ value: v, label: l }))]}
          containerClassName="w-52" />
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search request no / summary…"
            className="h-9 w-64 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
        </div>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} shown · pending value {taka(totalAmt)}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                <td className="px-4 py-3">
                  <p className="font-mono text-xs font-semibold text-gray-800">{r.requestNo}</p>
                  <p className="max-w-[260px] truncate text-xs text-gray-500">{r.summary || "—"}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{r.entityLabel ?? r.entityType}</p>
                  {r.entityNo && <p className="text-[11px] text-gray-400">#{r.entityNo}</p>}
                </td>
                <td className="px-4 py-3 text-gray-700">{taka(r.amount)}</td>
                <td className="px-4 py-3">
                  <p className="text-xs text-gray-600">Level {r.currentLevel}{r.totalLevels ? `/${r.totalLevels}` : ""} · <span className="text-gray-400">{r.currentRole || "—"}</span></p>
                  {r.totalLevels ? (
                    <div className="mt-1 flex h-1 w-24 overflow-hidden rounded-full bg-gray-100">
                      <div className="bg-primary-500" style={{ width: `${Math.min(((r.approvedLevels || 0) / r.totalLevels) * 100, 100)}%` }} />
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3"><span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${STATUS_CHIP[r.status] || "bg-gray-100 text-gray-600"}`}>{r.status}</span></td>
                <td className="px-4 py-3 text-xs text-gray-500">{fmtDt(r.createdAt)}</td>
                <td className="px-4 py-3"><ActionBtn row={r} /></td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                No {status ? status.toLowerCase() : ""} approval requests{mine ? " from you" : ""} — changes below their configured thresholds apply instantly.
              </td></tr>
            )}
            {loading && <tr><td colSpan={7} className="px-4 py-12 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-300" /></td></tr>}
          </tbody>
        </table>
      </div>

      {/* ── Action modal ── */}
      <CustomModal open={!!act} onClose={() => setAct(null)}
        title={`${act ? act.kind[0].toUpperCase() + act.kind.slice(1) : ""} — ${act?.row.requestNo ?? ""}`}>
        <div className="space-y-3">
          <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">{act?.row.summary}</p>
          {act?.kind === "cancel"
            ? <CustomInput label="Reason *" value={comment} onChange={(e: any) => setComment(e.target.value)} placeholder="Why is this being withdrawn?" />
            : <CustomInput label={act?.kind === "reject" ? "Rejection comment *" : "Comment"} value={comment}
                onChange={(e: any) => setComment(e.target.value)} placeholder={act?.kind === "escalate" ? "Escalation note (optional)…" : "Add a note (optional)…"} />}
          {act?.kind === "escalate" && <p className="text-xs text-gray-400">Sends the request to the next approval level (if any).</p>}
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setAct(null)}>Cancel</CustomButton>
            <CustomButton variant={act?.kind === "reject" ? "danger" : "primary"} disabled={busyId === act?.row.id} onClick={runAction}>
              {busyId === act?.row.id ? <Loader2 size={14} className="animate-spin" /> : <>{act?.kind === "approve" ? <CheckCircle2 size={14} /> : act?.kind === "reject" ? <XCircle size={14} /> : act?.kind === "escalate" ? <ArrowUpRight size={14} /> : <Ban size={14} />} Confirm {act?.kind}</>}
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ── Detail modal ── */}
      <CustomModal open={!!detail} onClose={() => setDetail(null)} title={`${detail?.requestNo ?? ""} — details`}>
        {detailLoading ? (
          <div className="py-8 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-300" /></div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-gray-50 p-2.5"><p className="text-gray-400">Entity</p><p className="mt-0.5 font-semibold text-gray-800">{detail.entityLabel ?? detail.entityType}</p></div>
              <div className="rounded-lg bg-gray-50 p-2.5"><p className="text-gray-400">Amount</p><p className="mt-0.5 font-semibold text-gray-800">{taka(detail.amount)}</p></div>
              <div className="rounded-lg bg-gray-50 p-2.5"><p className="text-gray-400">Status</p><p className={`mt-0.5 font-bold ${(STATUS_CHIP[detail.status] || "").split(" ")[1] || "text-gray-800"}`}>{detail.status}</p></div>
              <div className="rounded-lg bg-gray-50 p-2.5"><p className="text-gray-400">Current level</p><p className="mt-0.5 font-semibold text-gray-800">{detail.currentLevel} · {detail.currentRole || "—"}</p></div>
            </div>
            <p className="text-sm text-gray-600">{detail.summary}</p>
            {detail.payload && Object.keys(detail.payload).length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Proposed change</p>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-[11px] text-gray-100">{JSON.stringify(detail.payload, null, 2)}</pre>
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Approval trail</p>
              <div className="space-y-0">
                {(detail.steps || []).map((s: StepRow, i: number) => (
                  <div key={s.id || i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${STEP_CHIP[s.status] || "bg-gray-100 text-gray-500"}`}>{s.level}</span>
                      {i < (detail.steps?.length || 0) - 1 && <span className="h-full w-px bg-gray-100" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800">{s.role || "—"} <span className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${STEP_CHIP[s.status] || "bg-gray-100 text-gray-500"}`}>{s.status}</span></p>
                        <p className="text-[11px] text-gray-400">{s.actedAt ? fmtDt(s.actedAt) : ""}</p>
                      </div>
                      {s.comment && <p className="mt-0.5 text-xs text-gray-500">“{s.comment}”</p>}
                    </div>
                  </div>
                ))}
                {(detail.steps || []).length === 0 && <p className="text-sm text-gray-400">No steps recorded</p>}
              </div>
            </div>
            {detail.status === "PENDING" && (
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                <CustomButton variant="danger" size="sm" onClick={() => { setAct({ kind: "reject", row: detail }); setDetail(null); setComment(""); }}>Reject</CustomButton>
                <CustomButton size="sm" onClick={() => { setAct({ kind: "approve", row: detail }); setDetail(null); setComment(""); }}><CheckCircle2 size={13} /> Approve</CustomButton>
              </div>
            )}
          </div>
        ) : null}
      </CustomModal>
    </div>
  );
}
