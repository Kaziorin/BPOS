"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  Wallet,
  PlayCircle,
  XCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Scale,
  History,
  TrendingUp,
  RefreshCw,
  Search,
  Printer,
  FileText,
  Calculator,
  ShieldCheck,
  Eye,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomTable,
  CustomStatCard,
  CustomModal,
  ConfirmModal,
} from "@/components/custom";
import { money, dateTime } from "@/lib/format";

interface ShiftTxn {
  id: string;
  type: string;
  amount: string | number;
  note: string | null;
  createdAt: string;
  refType?: string | null;
}

interface Shift {
  id: string;
  shiftNo: string;
  branchId?: string;
  openedAt: string;
  closedAt: string | null;
  status: string;
  openingCash: string | number;
  expectedCash: string | number | null;
  countedCash: string | number | null;
  variance: string | number | null;
  needsApproval: boolean;
  approvedBy: string | null;
  note: string | null;
  userId?: string;
  txns?: ShiftTxn[];
}

interface Summary {
  cashSales: number;
  cashIn: number;
  cashOut: number;
  cashExpenses: number;
  cashRefunds: number;
  customerPaymentsIn: number;
  expectedCash: number;
  openingCash: number;
}

const TXN_META: Record<string, { label: string; icon: any; cls: string; sign: "+" | "-" }> = {
  CASH_SALE: { label: "POS Cash Sale", icon: CheckCircle2, cls: "text-emerald-700 bg-emerald-50 border-emerald-200", sign: "+" },
  CASH_IN: { label: "Cash In (Top-up)", icon: ArrowDownToLine, cls: "text-blue-700 bg-blue-50 border-blue-200", sign: "+" },
  CASH_OUT: { label: "Cash Out (Drop)", icon: ArrowUpFromLine, cls: "text-indigo-700 bg-indigo-50 border-indigo-200", sign: "-" },
  CASH_EXPENSE: { label: "Cash Expense", icon: Wallet, cls: "text-amber-700 bg-amber-50 border-amber-200", sign: "-" },
  CASH_REFUND: { label: "Cash Refund", icon: XCircle, cls: "text-rose-700 bg-rose-50 border-rose-200", sign: "-" },
  CASH_PAYMENT_IN: { label: "Customer Debt Pay", icon: ArrowDownToLine, cls: "text-teal-700 bg-teal-50 border-teal-200", sign: "+" },
};

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

export default function CashRegisterPage() {
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchId, setBranchId] = useState("");
  const [current, setCurrent] = useState<{ shift: Shift | null; summary: Summary | null } | null>(null);
  const [history, setHistory] = useState<Shift[]>([]);
  const [detail, setDetail] = useState<{ shift: Shift; summary: Summary; txns: ShiftTxn[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Active shift txns filter & search
  const [txnFilter, setTxnFilter] = useState("ALL");
  const [txnSearch, setTxnSearch] = useState("");

  // History filters & pagination
  const [historyStatusFilter, setHistoryStatusFilter] = useState("ALL");
  const [historySearch, setHistorySearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [openModal, setOpenModal] = useState(false);
  const [openingCash, setOpeningCash] = useState("");
  const [openShiftNote, setOpenShiftNote] = useState("");

  const [cashMoveModal, setCashMoveModal] = useState<"in" | "out" | null>(null);
  const [cashMoveAmount, setCashMoveAmount] = useState("");
  const [cashMoveNote, setCashMoveNote] = useState("");
  const [cashMoveReason, setCashMoveReason] = useState("");

  const [closeModal, setCloseModal] = useState(false);
  const [countedCash, setCountedCash] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [managerPin, setManagerPin] = useState("");
  const [showDenomCalc, setShowDenomCalc] = useState(false);
  const [denoms, setDenoms] = useState<Record<number, number>>({});

  const [approveConfirmShiftId, setApproveConfirmShiftId] = useState<string | null>(null);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async (showIndicator = false) => {
    if (!branchId) return;
    if (showIndicator) setRefreshing(true);
    try {
      const [curRes, histRes] = await Promise.all([
        api.get<{ data: { shift: Shift | null; summary: Summary | null } }>(`/cash-register/current?branchId=${branchId}`),
        api.get<{ data: Shift[] }>(`/cash-register?branchId=${branchId}&limit=50`),
      ]);
      setCurrent(curRes.data);
      setHistory(histRes.data || []);
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message || "Failed to load shift data");
    } finally {
      if (showIndicator) setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => {
    (async () => {
      try {
        const brRes = await api.get<{ data: any }>("/branches");
        const brs = (brRes.data as any)?.data ?? brRes.data ?? [];
        if (Array.isArray(brs)) {
          setBranches(brs.map((b: any) => ({ id: b.id, name: b.name })));
          if (brs.length > 0) setBranchId(brs[0].id);
        }
      } catch (err: any) {
        notify(false, err.message || "Failed to load branches");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (branchId) load();
  }, [branchId, load]);

  // Live poll for active open shift every 15 seconds
  useEffect(() => {
    if (current?.shift && current.shift.status === "OPEN") {
      pollRef.current = setInterval(() => load(false), 15000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [current?.shift?.status, load]);

  // Handle Denominations Calculator
  const denomTotal = useMemo(() => {
    return Object.entries(denoms).reduce((sum, [val, count]) => sum + (Number(val) * (Number(count) || 0)), 0);
  }, [denoms]);

  const applyDenomToCounted = () => {
    setCountedCash(String(denomTotal));
    setShowDenomCalc(false);
  };

  const handleDenomChange = (value: number, countStr: string) => {
    const count = parseInt(countStr) || 0;
    setDenoms((prev) => ({ ...prev, [value]: Math.max(0, count) }));
  };

  const resetDenoms = () => {
    setDenoms({});
  };

  // Open Shift
  async function handleOpenShift(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/cash-register/open", {
        branchId,
        openingCash: Number(openingCash) || 0,
        note: openShiftNote || undefined,
      });
      setOpenModal(false);
      setOpeningCash("");
      setOpenShiftNote("");
      notify(true, "Shift opened successfully — POS terminal ready for transactions");
      await load(true);
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  }

  // Cash In / Out
  async function handleCashMove(e: React.FormEvent) {
    e.preventDefault();
    if (!current?.shift || !cashMoveModal) return;
    setBusy(true);
    try {
      const fullNote = [cashMoveReason, cashMoveNote].filter(Boolean).join(" - ");
      await api.post(`/cash-register/${current.shift.id}/${cashMoveModal === "in" ? "cash-in" : "cash-out"}`, {
        amount: Number(cashMoveAmount),
        note: fullNote || undefined,
      });
      setCashMoveModal(null);
      setCashMoveAmount("");
      setCashMoveNote("");
      setCashMoveReason("");
      notify(true, `Cash ${cashMoveModal === "in" ? "in" : "out"} of ${money(Number(cashMoveAmount))} recorded`);
      await load(true);
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  }

  // Close Shift
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
        }
      );
      setCloseModal(false);
      setCountedCash("");
      setCloseNote("");
      setManagerPin("");
      resetDenoms();

      if (res.data.needsApproval) {
        notify(false, `Variance of ${money(res.data.variance)} exceeds ${money(res.data.threshold)} threshold — parked for manager approval`);
      } else {
        notify(true, `Shift successfully closed — Drawer balanced with variance ${money(res.data.variance)}`);
      }
      await load(true);
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  }

  // Approve Close
  async function handleApproveClose(shiftId: string) {
    setBusy(true);
    try {
      await api.post(`/cash-register/${shiftId}/approve-close`, {});
      notify(true, "Shift close variance approved by manager");
      setApproveConfirmShiftId(null);
      await load(true);
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  }

  // Open Detailed Audit View
  async function openDetail(shiftRow: Shift) {
    try {
      const res = await api.get<any>(`/cash-register/${shiftRow.id}`);
      const d = res.data;
      setDetail({ shift: d.shift, summary: d.summary, txns: d.shift.txns ?? d.txns ?? [] });
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    }
  }

  // Print Z-Report
  const handlePrintZReport = () => {
    window.print();
  };

  const shift = current?.shift ?? null;
  const summary = current?.summary ?? null;
  const isOpen = shift && (shift.status === "OPEN" || shift.status === "PENDING_APPROVAL");

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      if (historyStatusFilter !== "ALL" && h.status !== historyStatusFilter) return false;
      if (historySearch) {
        const q = historySearch.toLowerCase();
        if (!h.shiftNo.toLowerCase().includes(q) && !(h.note || "").toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [history, historyStatusFilter, historySearch]);

  const paginatedHistory = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, page, pageSize]);

  const selectedBranchName = branches.find((b) => b.id === branchId)?.name || "Main Branch";

  if (loading) {
    return (
      <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
        <div className="flex h-72 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
            <p className="text-sm font-medium text-slate-500">Loading cash register & drawer data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg animate-in slide-in-from-top duration-200 ${
            toast.ok
              ? "border-teal-200 bg-teal-50 text-teal-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {toast.ok ? <CheckCircle2 className="w-5 h-5 text-teal-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          {toast.text}
        </div>
      )}

      {/* ── Breadcrumb & Page Header ── */}
      <CustomBreadcrumb
        title="Cash Register & Shift Control"
        subtitle={`Branch: ${selectedBranchName} · Daily Cash Drawer Reconciliation & Audit Ledger`}
        icon={<Wallet className="w-5 h-5" />}
        items={[
          { label: "POS", href: "/pos" },
          { label: "Cash Register" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {branches.length > 0 && (
              <div className="relative">
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      📍 {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <CustomButton
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />}
              onClick={() => load(true)}
              disabled={refreshing}
            >
              Refresh
            </CustomButton>

            {!isOpen ? (
              <CustomButton
                variant="primary"
                size="sm"
                icon={<PlayCircle className="w-4 h-4" />}
                onClick={() => {
                  setOpeningCash("5000");
                  setOpenModal(true);
                }}
              >
                Open Shift
              </CustomButton>
            ) : (
              <CustomButton
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => {
                  setCountedCash(summary ? String(summary.expectedCash) : "");
                  setCloseModal(true);
                }}
              >
                Close Shift
              </CustomButton>
            )}
          </div>
        }
      />

      {/* ── Top Summary KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CustomStatCard
          label="Expected in Drawer"
          value={isOpen && summary ? money(summary.expectedCash) : money(0)}
          icon={Scale}
          tone="primary"
        />

        <CustomStatCard
          label="Today's Cash Sales"
          value={isOpen && summary ? money(summary.cashSales) : money(0)}
          icon={TrendingUp}
          tone="green"
        />

        <CustomStatCard
          label="Cash In & Customer Debt"
          value={isOpen && summary ? money(summary.cashIn + summary.customerPaymentsIn) : money(0)}
          icon={ArrowDownToLine}
          tone="blue"
        />

        <CustomStatCard
          label="Cash Out & Expenses"
          value={isOpen && summary ? money(summary.cashOut + summary.cashExpenses + summary.cashRefunds) : money(0)}
          icon={ArrowUpFromLine}
          tone="amber"
        />
      </div>

      {/* ── ACTIVE SHIFT HERO OR EMPTY STATE ── */}
      {!isOpen ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-2xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <Lock className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-800">No Shift Currently Open for {selectedBranchName}</h3>
          <p className="mt-1.5 max-w-md mx-auto text-sm text-slate-500">
            POS sales and cash tender transactions are protected and locked until a cashier shift is opened with an initial drawer float balance.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <CustomButton
              variant="primary"
              size="md"
              icon={<PlayCircle className="w-4 h-4" />}
              onClick={() => {
                setOpeningCash("5000");
                setOpenModal(true);
              }}
            >
              Open Shift Now
            </CustomButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Active Shift Panel */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    shift!.status === "OPEN"
                      ? "bg-teal-50 text-teal-700 border border-teal-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {shift!.status === "OPEN" ? <Unlock className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-base font-bold text-slate-900">{shift!.shiftNo}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        shift!.status === "OPEN"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                      {shift!.status === "OPEN" ? "ACTIVE & SELLING" : "AWAITING MANAGER APPROVAL"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Opened at <span className="font-medium text-slate-700">{dateTime(shift!.openedAt)}</span> · Initial Float:{" "}
                    <span className="font-medium text-slate-700">{money(shift!.openingCash)}</span>
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <CustomButton
                  variant="outline"
                  size="sm"
                  icon={<ArrowDownToLine className="w-4 h-4 text-blue-600" />}
                  onClick={() => {
                    setCashMoveModal("in");
                    setCashMoveAmount("");
                    setCashMoveNote("");
                  }}
                  disabled={shift!.status !== "OPEN"}
                >
                  Cash In
                </CustomButton>

                <CustomButton
                  variant="outline"
                  size="sm"
                  icon={<ArrowUpFromLine className="w-4 h-4 text-indigo-600" />}
                  onClick={() => {
                    setCashMoveModal("out");
                    setCashMoveAmount("");
                    setCashMoveNote("");
                  }}
                  disabled={shift!.status !== "OPEN"}
                >
                  Cash Out
                </CustomButton>

                <CustomButton
                  variant="outline"
                  size="sm"
                  icon={<FileText className="w-4 h-4 text-slate-600" />}
                  onClick={() => {
                    if (current?.shift) {
                      openDetail(current.shift);
                    }
                  }}
                >
                  Audit Ledger
                </CustomButton>

                <CustomButton
                  variant="primary"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  icon={<XCircle className="w-4 h-4" />}
                  onClick={() => {
                    setCountedCash(summary ? String(summary.expectedCash) : "");
                    setCloseModal(true);
                  }}
                >
                  Close Shift
                </CustomButton>
              </div>
            </div>

            {/* Shift Real-time Money Breakdown Grid */}
            {summary && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Opening Float</p>
                  <p className="mt-1 text-sm font-bold text-slate-800 tabular-nums">{money(summary.openingCash)}</p>
                </div>

                <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Cash Sales (+)</p>
                  <p className="mt-1 text-sm font-bold text-emerald-700 tabular-nums">{money(summary.cashSales)}</p>
                </div>

                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">Cash In (+)</p>
                  <p className="mt-1 text-sm font-bold text-blue-700 tabular-nums">
                    {money(summary.cashIn + summary.customerPaymentsIn)}
                  </p>
                </div>

                <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">Cash Out (-)</p>
                  <p className="mt-1 text-sm font-bold text-indigo-700 tabular-nums">{money(summary.cashOut)}</p>
                </div>

                <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Expenses (-)</p>
                  <p className="mt-1 text-sm font-bold text-amber-700 tabular-nums">{money(summary.cashExpenses)}</p>
                </div>

                <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Refunds (-)</p>
                  <p className="mt-1 text-sm font-bold text-rose-700 tabular-nums">{money(summary.cashRefunds)}</p>
                </div>
              </div>
            )}

            {/* Expected Cash in Drawer Hero Strip */}
            {summary && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between rounded-xl bg-gradient-to-r from-slate-900 to-teal-950 px-5 py-4 text-white shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-teal-300">
                    <Scale className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-300">Calculated Cash in Drawer (Current)</p>
                    <p className="text-[11px] text-teal-200">Float + Inflows - Outflows</p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-0 text-right">
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">{money(summary.expectedCash)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Pending Approval Alert Banner */}
          {shift!.status === "PENDING_APPROVAL" && shift!.variance != null && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    Shift Variance Over Threshold ({money(Number(shift!.variance))})
                  </h4>
                  <p className="text-xs text-amber-700">
                    Expected: <span className="font-semibold">{money(Number(shift!.expectedCash))}</span> · Counted:{" "}
                    <span className="font-semibold">{money(Number(shift!.countedCash))}</span> · Manager authorization required.
                  </p>
                </div>
              </div>
              <CustomButton
                variant="primary"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                icon={<ShieldCheck className="w-4 h-4" />}
                onClick={() => setApproveConfirmShiftId(shift!.id)}
                disabled={busy}
              >
                Authorize & Close Shift
              </CustomButton>
            </div>
          )}
        </div>
      )}

      {/* ─── SHIFT HISTORY & RECONCILIATION TABLE ─── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-800">Shift History & Reconciliation Audit</h3>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search Shift # or note..."
                className="h-9 w-48 rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <select
              value={historyStatusFilter}
              onChange={(e) => setHistoryStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {/* Shift Table */}
        <CustomTable<Shift>
          columns={[
            {
              key: "shiftNo",
              header: "Shift No",
              render: (row) => (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-700">{row.shiftNo}</span>
                  {row.needsApproval && (
                    <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      VARIANCE
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: "openedAt",
              header: "Time Span",
              render: (row) => (
                <div className="text-xs">
                  <p className="font-medium text-slate-800">{dateTime(row.openedAt)}</p>
                  <p className="text-[11px] text-slate-400">
                    {row.closedAt ? `Closed: ${dateTime(row.closedAt)}` : "Ongoing shift"}
                  </p>
                </div>
              ),
            },
            {
              key: "openingCash",
              header: "Opening Float",
              render: (row) => <span className="font-mono text-xs font-semibold text-slate-700">{money(row.openingCash)}</span>,
            },
            {
              key: "expectedCash",
              header: "Expected",
              render: (row) => (
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {row.expectedCash != null ? money(row.expectedCash) : "—"}
                </span>
              ),
            },
            {
              key: "countedCash",
              header: "Counted",
              render: (row) => (
                <span className="font-mono text-xs font-semibold text-slate-800">
                  {row.countedCash != null ? money(row.countedCash) : "—"}
                </span>
              ),
            },
            {
              key: "variance",
              header: "Variance",
              render: (row) => {
                if (row.variance == null) return <span className="text-xs text-slate-400">—</span>;
                const v = Number(row.variance);
                const isZero = Math.abs(v) < 0.01;
                const isOverThreshold = Math.abs(v) > 500;
                return (
                  <span
                    className={`inline-flex items-center font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                      isZero
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : isOverThreshold
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {v > 0 ? `+${money(v)}` : money(v)}
                  </span>
                );
              },
            },
            {
              key: "status",
              header: "Status",
              render: (row) => {
                if (row.status === "OPEN") {
                  return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 border border-teal-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-600"></span> Open
                    </span>
                  );
                }
                if (row.status === "PENDING_APPROVAL") {
                  return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                      <Clock className="w-3 h-3" /> Needs Approval
                    </span>
                  );
                }
                return (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    <Check className="w-3 h-3 text-slate-400" /> Closed
                  </span>
                );
              },
            },
            {
              key: "actions",
              header: "Actions",
              render: (row) => (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openDetail(row)}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Audit
                  </button>

                  {row.status === "PENDING_APPROVAL" && (
                    <button
                      onClick={() => setApproveConfirmShiftId(row.id)}
                      className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredHistory}
          pageSize={pageSize}
          showPagination={true}
          emptyMessage="No shift history found."
        />
      </div>

      {/* ─── MODAL: OPEN SHIFT ─── */}
      <CustomModal open={openModal} onClose={() => setOpenModal(false)} title="Open New Cash Register Shift" size="md">
        <form onSubmit={handleOpenShift} className="space-y-4">
          <div className="rounded-lg bg-teal-50/70 border border-teal-100 p-3.5 text-xs text-teal-900 flex items-start gap-2.5">
            <PlayCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Starting a New POS Selling Session</p>
              <p className="text-teal-700 mt-0.5">
                The opening cash float balance will be recorded in the register drawer for branch{" "}
                <span className="font-semibold">{selectedBranchName}</span>.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Opening Float Balance (Tk) *
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              placeholder="5000"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-base font-bold font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              autoFocus
              required
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[1000, 2000, 5000, 10000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setOpeningCash(String(amt))}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 transition"
                >
                  +{money(amt)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Opening Remarks / Cashier Notes (Optional)
            </label>
            <input
              type="text"
              value={openShiftNote}
              onChange={(e) => setOpenShiftNote(e.target.value)}
              placeholder="e.g. Morning shift counter 1 opening"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <CustomButton variant="outline" size="sm" onClick={() => setOpenModal(false)} type="button">
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              icon={<PlayCircle className="w-4 h-4" />}
              type="submit"
              disabled={busy}
            >
              {busy ? "Opening..." : "Confirm & Open Shift"}
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ─── MODAL: CASH IN / CASH OUT ─── */}
      <CustomModal
        open={cashMoveModal !== null}
        onClose={() => setCashMoveModal(null)}
        title={cashMoveModal === "in" ? "Cash In (Add to Drawer Float)" : "Cash Out (Drawer Drop / Withdrawal)"}
        size="md"
      >
        <form onSubmit={handleCashMove} className="space-y-4">
          <div
            className={`rounded-lg border p-3.5 text-xs flex items-start gap-2.5 ${
              cashMoveModal === "in"
                ? "bg-blue-50/70 border-blue-100 text-blue-900"
                : "bg-indigo-50/70 border-indigo-100 text-indigo-900"
            }`}
          >
            {cashMoveModal === "in" ? (
              <ArrowDownToLine className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            ) : (
              <ArrowUpFromLine className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {cashMoveModal === "in" ? "Float Top-up or Manual Cash Inflow" : "Safe Drop or Drawer Outflow"}
              </p>
              <p className="opacity-90 mt-0.5">
                {cashMoveModal === "in"
                  ? "This amount will increase the drawer's expected cash balance."
                  : "This amount will reduce the drawer's expected cash balance."}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Amount (Tk) *
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={cashMoveAmount}
              onChange={(e) => setCashMoveAmount(e.target.value)}
              placeholder="1000"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-base font-bold font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Quick Category / Reason
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(cashMoveModal === "in"
                ? ["Float Top-up", "Change Replenish", "Owner Capital In", "Bank Cash Draw"]
                : ["Bank Drop", "Safe Transfer", "Supplier Cash Pay", "Owner Draw", "Emergency Expense"]
              ).map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setCashMoveReason(reason)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                    cashMoveReason === reason
                      ? "border-teal-600 bg-teal-50 text-teal-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={cashMoveNote}
              onChange={(e) => setCashMoveNote(e.target.value)}
              placeholder="Additional memo or reference..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <CustomButton variant="outline" size="sm" onClick={() => setCashMoveModal(null)} type="button">
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              className={cashMoveModal === "in" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}
              type="submit"
              disabled={busy}
            >
              {busy ? "Recording..." : `Record Cash ${cashMoveModal === "in" ? "In" : "Out"}`}
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ─── MODAL: CLOSE SHIFT WITH DENOMINATIONS CALCULATOR ─── */}
      <CustomModal open={closeModal} onClose={() => setCloseModal(false)} title="Reconcile & Close Shift" size="lg">
        {shift && (
          <form onSubmit={handleCloseShift} className="space-y-4">
            {/* Expected Summary Banner */}
            {summary && (
              <div className="rounded-xl bg-slate-900 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-300">Expected Cash In Drawer</p>
                    <p className="text-[11px] text-teal-300">Float ({money(summary.openingCash)}) + Inflows - Outflows</p>
                  </div>
                  <p className="font-mono text-2xl font-bold text-teal-400">{money(summary.expectedCash)}</p>
                </div>
              </div>
            )}

            {/* Counted Cash Input & Denominations Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Actual Counted Cash In Drawer (Tk) *
                </label>
                <button
                  type="button"
                  onClick={() => setShowDenomCalc(!showDenomCalc)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  {showDenomCalc ? "Hide Denominations Tally" : "Open Denominations Tally"}
                </button>
              </div>

              <input
                type="number"
                min="0"
                step="any"
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                placeholder="Enter physical cash counted in drawer"
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-base font-bold font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                autoFocus
                required
              />

              {/* Denominations Calculator Grid */}
              {showDenomCalc && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-700">Cash Note / Coin Counter</span>
                    <span className="font-mono text-xs font-bold text-teal-700">Tally Sum: {money(denomTotal)}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {DENOMINATIONS.map((d) => (
                      <div key={d} className="rounded-lg border border-slate-200 bg-white p-2 text-center">
                        <span className="text-[11px] font-bold text-slate-600">Tk {d}</span>
                        <input
                          type="number"
                          min="0"
                          value={denoms[d] || ""}
                          onChange={(e) => handleDenomChange(d, e.target.value)}
                          placeholder="0"
                          className="mt-1 w-full rounded border border-slate-200 px-1.5 py-1 text-center font-mono text-xs focus:border-teal-600 focus:outline-hidden"
                        />
                        <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                          ={money(d * (denoms[d] || 0))}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={resetDenoms}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      Clear Tally
                    </button>
                    <CustomButton
                      variant="primary"
                      size="sm"
                      type="button"
                      onClick={applyDenomToCounted}
                      icon={<Check className="w-3.5 h-3.5" />}
                    >
                      Use Tally Total ({money(denomTotal)})
                    </CustomButton>
                  </div>
                </div>
              )}

              {/* Real-time Variance Calculation */}
              {summary && countedCash !== "" && (
                <div
                  className={`rounded-lg border p-3 text-xs flex items-center justify-between ${
                    Math.abs(Number(countedCash) - summary.expectedCash) < 0.01
                      ? "border-emerald-200 bg-emerald-50/70 text-emerald-800"
                      : Math.abs(Number(countedCash) - summary.expectedCash) > 500
                      ? "border-rose-200 bg-rose-50/70 text-rose-800"
                      : "border-amber-200 bg-amber-50/70 text-amber-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {Math.abs(Number(countedCash) - summary.expectedCash) < 0.01 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                    <span>
                      {Math.abs(Number(countedCash) - summary.expectedCash) < 0.01
                        ? "Drawer is perfectly balanced (Zero Variance)"
                        : Math.abs(Number(countedCash) - summary.expectedCash) > 500
                        ? "Variance exceeds ৳500 policy threshold (Manager approval required)"
                        : "Variance is within tolerance"}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm">
                    {Number(countedCash) - summary.expectedCash > 0 ? "+" : ""}
                    {money(Number(countedCash) - summary.expectedCash)}
                  </span>
                </div>
              )}
            </div>

            {/* Manager Override / Authorization PIN if variance over threshold */}
            {summary && countedCash !== "" && Math.abs(Number(countedCash) - summary.expectedCash) > 500 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3.5 space-y-2">
                <label className="block text-xs font-bold text-amber-900">
                  Manager Authorization / User ID (Optional Override)
                </label>
                <input
                  type="text"
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value)}
                  placeholder="Enter Manager Username / User ID to instantly approve"
                  className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
                <p className="text-[11px] text-amber-700">
                  If left empty, this shift will close into <span className="font-semibold">PENDING_APPROVAL</span> status for manager sign-off.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Closing Remarks / End of Shift Notes
              </label>
              <textarea
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                rows={2}
                placeholder="Explain any cash discrepancy, safe drops, or shift handoff notes..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <CustomButton variant="outline" size="sm" onClick={() => setCloseModal(false)} type="button">
                Cancel
              </CustomButton>
              <CustomButton
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                icon={<XCircle className="w-4 h-4" />}
                type="submit"
                disabled={busy}
              >
                {busy ? "Closing Shift..." : "Confirm & Close Shift"}
              </CustomButton>
            </div>
          </form>
        )}
      </CustomModal>

      {/* ─── MODAL: DETAILED AUDIT LEDGER / Z-REPORT SLIDEOVER ─── */}
      <CustomModal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={`Shift Audit & Z-Report: ${detail?.shift.shiftNo || ""}`}
        size="2xl"
      >
        {detail && (
          <div className="space-y-5">
            {/* Shift Header Meta */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200">
              <div>
                <p className="text-xs text-slate-500">
                  Shift Period: <span className="font-semibold text-slate-800">{dateTime(detail.shift.openedAt)}</span> →{" "}
                  <span className="font-semibold text-slate-800">
                    {detail.shift.closedAt ? dateTime(detail.shift.closedAt) : "Active (Unclosed)"}
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Status: <span className="font-semibold text-teal-700">{detail.shift.status}</span> · Approved By:{" "}
                  <span className="font-semibold text-slate-700">{detail.shift.approvedBy || "N/A"}</span>
                </p>
              </div>

              <CustomButton
                variant="outline"
                size="sm"
                icon={<Printer className="w-4 h-4 text-slate-600" />}
                onClick={handlePrintZReport}
              >
                Print Z-Report
              </CustomButton>
            </div>

            {/* Reconciliation KPI Strip */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expected in Drawer</p>
                <p className="mt-1 font-mono text-base font-bold text-slate-800">{money(detail.summary.expectedCash)}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Physical Counted</p>
                <p className="mt-1 font-mono text-base font-bold text-slate-800">
                  {detail.shift.countedCash != null ? money(detail.shift.countedCash) : "—"}
                </p>
              </div>

              <div
                className={`rounded-xl border p-3 ${
                  detail.shift.variance != null && Math.abs(Number(detail.shift.variance)) > 0
                    ? "border-rose-200 bg-rose-50/70"
                    : "border-emerald-200 bg-emerald-50/70"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reconciled Variance</p>
                <p
                  className={`mt-1 font-mono text-base font-bold ${
                    detail.shift.variance != null && Math.abs(Number(detail.shift.variance)) > 0
                      ? "text-rose-700"
                      : "text-emerald-700"
                  }`}
                >
                  {detail.shift.variance != null ? money(detail.shift.variance) : "—"}
                </p>
              </div>
            </div>

            {/* Transaction Ledger Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Itemized Cash Movements ({detail.txns.length})
                </h4>
              </div>

              {detail.txns.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  No individual transactions recorded in this shift yet.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {detail.txns.map((t) => {
                    const meta = TXN_META[t.type] || TXN_META.CASH_IN;
                    const Icon = meta.icon;
                    return (
                      <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50/50">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${meta.cls}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{meta.label}</p>
                            <p className="text-[10px] text-slate-400">
                              {dateTime(t.createdAt)} {t.note ? `· ${t.note}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className={`font-mono text-xs font-bold ${meta.sign === "+" ? "text-emerald-700" : "text-rose-700"}`}>
                          {meta.sign}
                          {money(Number(t.amount))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Note & Remarks */}
            {detail.shift.note && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Shift Notes: </span>
                {detail.shift.note}
              </div>
            )}
          </div>
        )}
      </CustomModal>

      {/* ─── MANAGER APPROVAL CONFIRMATION MODAL ─── */}
      <ConfirmModal
        open={approveConfirmShiftId !== null}
        onClose={() => setApproveConfirmShiftId(null)}
        onConfirm={() => {
          if (approveConfirmShiftId) {
            handleApproveClose(approveConfirmShiftId);
          }
        }}
        title="Authorize Shift Close with Variance"
        message="Are you sure you want to approve and close this shift as manager? The counted variance will be committed to the accounting ledger."
        confirmText="Approve & Close Shift"
        variant="primary"
        loading={busy}
      />
    </div>
  );
}
