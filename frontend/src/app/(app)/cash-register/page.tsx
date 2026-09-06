"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Loader2, Wallet, PlayCircle, XCircle, ArrowDownToLine, ArrowUpFromLine,
  Lock, Unlock, CheckCircle, AlertTriangle, Clock, Scale, History, ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";

interface ShiftTxn { id: string; type: string; amount: string; note: string | null; createdAt: string; refType: string | null }
interface Shift {
  id: string;
  shiftNo: string;
  openedAt: string;
  closedAt: string | null;
  status: string;
  openingCash: string;
  expectedCash: string | null;
  countedCash: string | null;
  variance: string | null;
  needsApproval: boolean;
  approvedBy: string | null;
  note: string | null;
}
interface Summary {
  cashSales: number; cashIn: number; cashOut: number; cashExpenses: number;
  cashRefunds: number; customerPaymentsIn: number; expectedCash: number; openingCash: number;
}

const TXN_META: Record<string, { label: string; icon: any; cls: string }> = {
  CASH_SALE: { label: "Cash Sale", icon: CheckCircle, cls: "text-emerald-600 bg-emerald-50" },
  CASH_IN: { label: "Cash In", icon: ArrowDownToLine, cls: "text-blue-600 bg-blue-50" },
  CASH_OUT: { label: "Cash Out", icon: ArrowUpFromLine, cls: "text-indigo-600 bg-indigo-50" },
  CASH_EXPENSE: { label: "Cash Expense", icon: Wallet, cls: "text-amber-600 bg-amber-50" },
  CASH_REFUND: { label: "Cash Refund", icon: XCircle, cls: "text-rose-600 bg-rose-50" },
  CASH_PAYMENT_IN: { label: "Customer Payment", icon: ArrowDownToLine, cls: "text-emerald-600 bg-emerald-50" },
};

const fmt = (n: number) => `৳${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function CashRegisterPage() {
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchId, setBranchId] = useState("");
  const [current, setCurrent] = useState<{ shift: Shift | null; summary: Summary | null } | null>(null);
  const [history, setHistory] = useState<Shift[]>([]);
  const [detail, setDetail] = useState<{ shift: Shift; summary: Summary; txns: ShiftTxn[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Modals
  const [openModal, setOpenModal] = useState(false);
  const [openingCash, setOpeningCash] = useState("");
  const [cashMoveModal, setCashMoveModal] = useState<"in" | "out" | null>(null);
  const [cashMoveAmount, setCashMoveAmount] = useState("");
  const [cashMoveNote, setCashMoveNote] = useState("");
  const [closeModal, setCloseModal] = useState(false);
  const [countedCash, setCountedCash] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [managerPin, setManagerPin] = useState(""); // explicit manager approval token (username acts as manager)

  const notify = (ok: boolean, text: string) => { setToast({ ok, text }); setTimeout(() => setToast(null), 4000); };

  const load = useCallback(async () => {
    if (!branchId) return;
    try {
      const [curRes, histRes] = await Promise.all([
        api.get<{ data: { shift: Shift | null; summary: Summary | null } }>(`/cash-register/current?branchId=${branchId}`),
        api.get<{ data: Shift[] }>(`/cash-register?branchId=${branchId}&limit=10`),
      ]);
      setCurrent(curRes.data);
      setHistory(histRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  }, [branchId]);

  useEffect(() => {
    (async () => {
      try {
        const brRes = await api.get<{ data: any }>("/branches");
        const brs = (brRes.data as any)?.data ?? [];
        setBranches(brs.map((b: any) => ({ id: b.id, name: b.name })));
        if (brs.length > 0) setBranchId(brs[0].id);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => { if (branchId) load(); }, [branchId, load]);

  // Live poll for the open shift summary every 10s
  useEffect(() => {
    if (current?.shift && current.shift.status === "OPEN") {
      pollRef.current = setInterval(load, 10000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [current?.shift?.status, load]);

  async function handleOpenShift(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/cash-register/open", { branchId, openingCash: Number(openingCash) || 0 });
      setOpenModal(false);
      setOpeningCash("");
      notify(true, "Shift opened — POS sales unlocked");
      await load();
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    } finally { setBusy(false); }
  }

  async function handleCashMove(e: React.FormEvent) {
    e.preventDefault();
    if (!current?.shift || !cashMoveModal) return;
    setBusy(true);
    try {
      await api.post(`/cash-register/${current.shift.id}/${cashMoveModal === "in" ? "cash-in" : "cash-out"}`, {
        amount: Number(cashMoveAmount),
        note: cashMoveNote || undefined,
      });
      setCashMoveModal(null);
      setCashMoveAmount("");
      setCashMoveNote("");
      notify(true, `Cash ${cashMoveModal === "in" ? "in" : "out"} recorded`);
      await load();
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    } finally { setBusy(false); }
  }

  async function handleCloseShift(e: React.FormEvent) {
    e.preventDefault();
    if (!current?.shift) return;
    setBusy(true);
    try {
      const res = await api.post<{ data: { approved: boolean; needsApproval: boolean; variance: number; threshold: number } }>(
        `/cash-register/${current.shift.id}/close`,
        {
          countedCash: Number(countedCash),
          note: closeNote || undefined,
          managerUserId: managerPin || undefined,
        },
      );
      setCloseModal(false);
      setCountedCash(""); setCloseNote(""); setManagerPin("");
      if (res.data.needsApproval) {
        notify(false, `Variance ৳${res.data.variance} exceeds ৳${res.data.threshold} — parked for manager approval`);
      } else {
        notify(true, `Shift closed — variance ৳${res.data.variance}`);
      }
      await load();
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    } finally { setBusy(false); }
  }

  async function handleApproveClose(shiftId: string) {
    if (!confirm("Approve this shift close as manager?")) return;
    setBusy(true);
    try {
      await api.post(`/cash-register/${shiftId}/approve-close`, {});
      notify(true, "Shift close approved");
      await load();
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    } finally { setBusy(false); }
  }

  async function openDetail(shiftRow: Shift) {
    try {
      const res = await api.get<any>(`/cash-register/${shiftRow.id}`);
      const d = res.data;
      setDetail({ shift: d.shift, summary: d.summary, txns: d.shift.txns ?? [] });
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    }
  }

  const inputCls = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";
  const shift = current?.shift ?? null;
  const summary = current?.summary ?? null;
  const isOpen = shift && (shift.status === "OPEN" || shift.status === "PENDING_APPROVAL");

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-gray-300" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Cash Register & Shift</h1>
          <p className="mt-1 text-sm text-gray-500">Open → movements → close → variance → approval (§10.19)</p>
        </div>
        {branches.length > 0 && (
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {toast && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${toast.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {toast.ok ? <CheckCircle size={16} /> : <AlertTriangle size={16} />} {toast.text}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      )}

      {/* ─── CURRENT SHIFT ─── */}
      {!isOpen ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-white to-primary-50/40 p-12 text-center">
          <Lock size={44} className="mx-auto text-gray-300" />
          <p className="mt-4 font-semibold text-gray-700">No shift is open</p>
          <p className="mt-1 text-sm text-gray-400">POS sales are blocked until a shift opens — open one to start selling.</p>
          <button onClick={() => setOpenModal(true)}
            className="mx-auto mt-5 flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary-700">
            <PlayCircle size={18} /> Open Shift
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Shift status hero */}
          <div className={`rounded-2xl border p-6 shadow-sm ${shift!.status === "OPEN" ? "border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-white" : "border-amber-100 bg-gradient-to-br from-amber-50/70 via-white to-white"}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${shift!.status === "OPEN" ? "bg-emerald-100" : "bg-amber-100"}`}>
                  {shift!.status === "OPEN" ? <Unlock size={22} className="text-emerald-600" /> : <Clock size={22} className="text-amber-600" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-mono text-lg font-bold text-gray-900">{shift!.shiftNo}</h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${shift!.status === "OPEN" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {shift!.status === "OPEN" ? "OPEN — POS active" : "PENDING APPROVAL"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Opened {new Date(shift!.openedAt).toLocaleString()} · Opening cash {fmt(Number(shift!.openingCash))}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setCashMoveModal("in")} disabled={shift!.status !== "OPEN"}
                  className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                  <ArrowDownToLine size={14} /> Cash In
                </button>
                <button onClick={() => setCashMoveModal("out")} disabled={shift!.status !== "OPEN"}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50">
                  <ArrowUpFromLine size={14} /> Cash Out
                </button>
                <button onClick={() => { setCountedCash(summary ? String(summary.expectedCash) : ""); setCloseModal(true); }}
                  className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-primary-700">
                  <XCircle size={14} /> Close Shift
                </button>
              </div>
            </div>

            {/* Expected cash breakdown */}
            {summary && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Cash Sales", value: summary.cashSales, cls: "text-emerald-600", bg: "bg-emerald-50/80" },
                  { label: "Cash In", value: summary.cashIn + summary.customerPaymentsIn, cls: "text-blue-600", bg: "bg-blue-50/80" },
                  { label: "Cash Out", value: summary.cashOut, cls: "text-indigo-600", bg: "bg-indigo-50/80" },
                  { label: "Cash Expenses", value: summary.cashExpenses + summary.cashRefunds, cls: "text-amber-600", bg: "bg-amber-50/80" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl p-3 ${s.bg}`}>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{s.label}</p>
                    <p className={`mt-1 text-lg font-bold tabular-nums ${s.cls}`}>{fmt(s.value)}</p>
                  </div>
                ))}
              </div>
            )}
            {summary && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-900 px-5 py-4 text-white shadow-inner">
                <p className="flex items-center gap-2 text-sm font-medium text-gray-300"><Scale size={16} /> Expected cash in drawer</p>
                <p className="text-2xl font-bold tabular-nums">{fmt(summary.expectedCash)}</p>
              </div>
            )}
          </div>

          {/* Pending approval banner */}
          {shift!.status === "PENDING_APPROVAL" && shift!.variance != null && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-3">
                <AlertTriangle size={22} className="text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">Variance ৳{Number(shift!.variance).toLocaleString()} exceeds threshold</p>
                  <p className="text-xs text-amber-700">Expected {fmt(Number(shift!.expectedCash))} · Counted {fmt(Number(shift!.countedCash))} — manager approval required to close.</p>
                </div>
              </div>
              <button onClick={() => handleApproveClose(shift!.id)} disabled={busy}
                className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve & Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── HISTORY ─── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-50 px-5 py-4">
          <History size={17} className="text-primary-600" />
          <h2 className="font-semibold text-gray-900">Shift History</h2>
        </div>
        {history.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">No shifts recorded yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.map((h) => {
              const variance = h.variance != null ? Number(h.variance) : null;
              return (
                <button key={h.id} onClick={() => openDetail(h)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-primary-50/30">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      h.status === "CLOSED" ? "bg-gray-100" : h.status === "PENDING_APPROVAL" ? "bg-amber-100" : "bg-emerald-100"
                    }`}>
                      <Clock size={15} className={h.status === "CLOSED" ? "text-gray-500" : h.status === "PENDING_APPROVAL" ? "text-amber-600" : "text-emerald-600"} />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold text-gray-900">{h.shiftNo}</p>
                      <p className="text-[11px] text-gray-400">
                        {new Date(h.openedAt).toLocaleString()} {h.closedAt ? `→ ${new Date(h.closedAt).toLocaleTimeString()}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {h.expectedCash && <p className="hidden text-xs text-gray-400 sm:block">exp {fmt(Number(h.expectedCash))}</p>}
                    {variance != null && (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
                        variance === 0 ? "bg-emerald-50 text-emerald-700"
                        : Math.abs(variance) > 500 ? "bg-rose-50 text-rose-700"
                        : "bg-amber-50 text-amber-700"
                      }`}>
                      var {variance >= 0 ? "+" : ""}{variance.toLocaleString()}
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${h.status === "CLOSED" ? "bg-gray-100 text-gray-600" : "bg-amber-50 text-amber-700"}`}>
                      {h.status === "CLOSED" ? (h.needsApproval ? "CLOSED (approved)" : "CLOSED") : h.status.replace("_", " ")}
                    </span>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── MODALS ─── */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm" onClick={() => setOpenModal(false)}>
          <form onSubmit={handleOpenShift} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900"><PlayCircle size={20} className="text-emerald-600" /> Open Shift</h2>
            <p className="mt-1 text-xs text-gray-400">Opening cash enters the drawer balance. Sales stay blocked until this point.</p>
            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Opening Cash (৳)</label>
              <input type="number" min="0" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} className={inputCls} placeholder="5000" autoFocus />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setOpenModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {busy && <Loader2 size={14} className="animate-spin" />} Open Shift
              </button>
            </div>
          </form>
        </div>
      )}

      {cashMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm" onClick={() => setCashMoveModal(null)}>
          <form onSubmit={handleCashMove} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              {cashMoveModal === "in" ? <ArrowDownToLine size={20} className="text-blue-600" /> : <ArrowUpFromLine size={20} className="text-indigo-600" />}
              {cashMoveModal === "in" ? "Cash In" : "Cash Out"}
            </h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount (৳)</label>
                <input type="number" min="1" value={cashMoveAmount} onChange={(e) => setCashMoveAmount(e.target.value)} className={inputCls} autoFocus required />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Note</label>
                <input value={cashMoveNote} onChange={(e) => setCashMoveNote(e.target.value)} className={inputCls} placeholder={cashMoveModal === "in" ? "Float top-up" : "Bank deposit"} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setCashMoveModal(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={busy} className={`rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 ${cashMoveModal === "in" ? "bg-blue-600 hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                {busy && <Loader2 size={14} className="inline animate-spin" />} Record
              </button>
            </div>
          </form>
        </div>
      )}

      {closeModal && shift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm" onClick={() => setCloseModal(false)}>
          <form onSubmit={handleCloseShift} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900"><XCircle size={20} className="text-primary-600" /> Close Shift</h2>
            {summary && (
              <div className="mt-3 rounded-xl bg-gray-900 p-4 text-white">
                <div className="flex justify-between text-sm"><span className="text-gray-300">Expected in drawer</span><span className="font-bold tabular-nums">{fmt(summary.expectedCash)}</span></div>
              </div>
            )}
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Counted Cash (৳) *</label>
                <input type="number" min="0" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} className={inputCls} autoFocus required />
                {summary && countedCash !== "" && (
                  <p className={`mt-1.5 text-xs font-medium ${
                    Math.abs(Number(countedCash) - summary.expectedCash) > 500 ? "text-rose-600" : "text-emerald-600"
                  }`}>
                    Variance: {fmt(Number(countedCash) - summary.expectedCash)} {Math.abs(Number(countedCash) - summary.expectedCash) > 500 && "— exceeds threshold, manager approval required"}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Manager (optional — skip to park for approval if variance is over threshold)</label>
                <input value={managerPin} onChange={(e) => setManagerPin(e.target.value)} className={inputCls} placeholder="manager user id for over-threshold close" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Note</label>
                <input value={closeNote} onChange={(e) => setCloseNote(e.target.value)} className={inputCls} placeholder="End-of-day remarks" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setCloseModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                {busy && <Loader2 size={14} className="animate-spin" />} Close Shift
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── DETAIL DRAWER ─── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/40 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-lg font-bold text-gray-900">{detail.shift.shiftNo}</h2>
              <button onClick={() => setDetail(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><XCircle size={18} /></button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-gray-50 p-3"><p className="text-[10px] uppercase text-gray-400">Expected</p><p className="mt-1 font-bold tabular-nums">{fmt(detail.summary.expectedCash)}</p></div>
              <div className="rounded-xl bg-gray-50 p-3"><p className="text-[10px] uppercase text-gray-400">Counted</p><p className="mt-1 font-bold tabular-nums">{detail.shift.countedCash ? fmt(Number(detail.shift.countedCash)) : "—"}</p></div>
              <div className={`rounded-xl p-3 ${detail.shift.variance && Math.abs(Number(detail.shift.variance)) > 0 ? "bg-rose-50" : "bg-emerald-50"}`}>
                <p className="text-[10px] uppercase text-gray-400">Variance</p>
                <p className={`mt-1 font-bold tabular-nums ${detail.shift.variance && Math.abs(Number(detail.shift.variance)) > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                  {detail.shift.variance ?? "—"}
                </p>
              </div>
            </div>
            <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-400">Movement Ledger ({detail.txns.length})</h3>
            <div className="mt-2 space-y-1.5">
              {detail.txns.map((t) => {
                const meta = TXN_META[t.type] ?? TXN_META.CASH_IN;
                return (
                  <div key={t.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.cls}`}><meta.icon size={14} /></div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{meta.label}</p>
                        <p className="text-[10px] text-gray-400">{new Date(t.createdAt).toLocaleTimeString()} {t.note ? `· ${t.note}` : ""}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-gray-900">{fmt(Number(t.amount))}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
