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
  CustomTableColumn,
  CustomStatCard,
  CustomModal,
  ConfirmModal,
  CustomInput,
  CustomSelect,
  CustomTextarea,
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
  CASH_IN: { label: "Cash In (Top-up)", icon: ArrowDownToLine, cls: "text-[#0284C7] bg-sky-50 border-sky-200", sign: "+" },
  CASH_OUT: { label: "Cash Out (Drop)", icon: ArrowUpFromLine, cls: "text-indigo-700 bg-indigo-50 border-indigo-200", sign: "-" },
  CASH_EXPENSE: { label: "Cash Expense", icon: Wallet, cls: "text-amber-700 bg-amber-50 border-amber-200", sign: "-" },
  CASH_REFUND: { label: "Cash Refund", icon: XCircle, cls: "text-rose-700 bg-rose-50 border-rose-200", sign: "-" },
  CASH_PAYMENT_IN: { label: "Customer Debt Pay", icon: ArrowDownToLine, cls: "text-[#0369A1] bg-sky-50 border-sky-200", sign: "+" },
};

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

export default function CashRegisterPage() {
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchId, setBranchId] = useState("");
  const [current, setCurrent] = useState<{ shift: Shift | null; summary: Summary | null } | null>(null);
  const [history, setHistory] = useState<Shift[]>([]);
  const [totalHistory, setTotalHistory] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detail, setDetail] = useState<{ shift: Shift; summary: Summary; txns: ShiftTxn[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // History filters & API pagination
  const [historyStatusFilter, setHistoryStatusFilter] = useState("ALL");
  const [historySearch, setHistorySearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  // Debounce search input for API querying
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(historySearch);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [historySearch]);

  const loadCurrent = useCallback(async (showIndicator = false) => {
    if (!branchId) return;
    if (showIndicator) setRefreshing(true);
    try {
      const curRes = await api.get<{ data: { shift: Shift | null; summary: Summary | null } }>(
        `/cash-register/current?branchId=${branchId}`
      );
      setCurrent(curRes.data);
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message || "Failed to load shift data");
    } finally {
      if (showIndicator) setRefreshing(false);
    }
  }, [branchId]);

  const loadHistory = useCallback(
    async (
      pageToLoad = page,
      sizeToLoad = pageSize,
      statusFilter = historyStatusFilter,
      searchFilter = debouncedSearch
    ) => {
      if (!branchId) return;
      setHistoryLoading(true);
      try {
        let url = `/cash-register?branchId=${branchId}&page=${pageToLoad}&limit=${sizeToLoad}`;
        if (statusFilter && statusFilter !== "ALL") {
          url += `&status=${encodeURIComponent(statusFilter)}`;
        }
        if (searchFilter && searchFilter.trim()) {
          url += `&search=${encodeURIComponent(searchFilter.trim())}`;
        }
        const histRes = await api.get<{
          data: Shift[];
          pagination?: { page: number; limit: number; total: number; totalPages: number };
        }>(url);
        setHistory(histRes.data || []);
        if (histRes.pagination) {
          setTotalHistory(histRes.pagination.total);
        } else {
          setTotalHistory((histRes.data || []).length);
        }
      } catch (err: any) {
        notify(false, err.response?.data?.error || err.message || "Failed to load shift history");
      } finally {
        setHistoryLoading(false);
      }
    },
    [branchId, page, pageSize, historyStatusFilter, debouncedSearch]
  );

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
    if (branchId) {
      loadCurrent();
    }
  }, [branchId, loadCurrent]);

  useEffect(() => {
    if (branchId) {
      loadHistory(page, pageSize, historyStatusFilter, debouncedSearch);
    }
  }, [branchId, page, pageSize, historyStatusFilter, debouncedSearch, loadHistory]);

  // Live poll for active open shift every 15 seconds
  useEffect(() => {
    if (current?.shift && current.shift.status === "OPEN") {
      pollRef.current = setInterval(() => loadCurrent(false), 15000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [current?.shift?.status, loadCurrent]);

  // Handle Denominations Calculator
  const denomTotal = useMemo(() => {
    return Object.entries(denoms).reduce((sum, [val, count]) => sum + Number(val) * (Number(count) || 0), 0);
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
      await Promise.all([loadCurrent(true), loadHistory(1, pageSize, historyStatusFilter, debouncedSearch)]);
      setPage(1);
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
      await loadCurrent(true);
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
      await Promise.all([loadCurrent(true), loadHistory(1, pageSize, historyStatusFilter, debouncedSearch)]);
      setPage(1);
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
      await Promise.all([loadCurrent(true), loadHistory(page, pageSize, historyStatusFilter, debouncedSearch)]);
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
      setDetail({ shift: d.shift, summary: d.summary, txns: d.shift?.txns ?? d.txns ?? [] });
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    }
  }

  // Print Z-Report
  const handlePrintZReport = () => {
    window.print();
  };

  const handleRefresh = async () => {
    await Promise.all([
      loadCurrent(true),
      loadHistory(page, pageSize, historyStatusFilter, debouncedSearch),
    ]);
  };

  const shift = current?.shift ?? null;
  const summary = current?.summary ?? null;
  const isOpen = shift && (shift.status === "OPEN" || shift.status === "PENDING_APPROVAL");

  const selectedBranchName = branches.find((b) => b.id === branchId)?.name || "Main Branch";

  // Shift History Table Columns (Sortable)
  const historyColumns: CustomTableColumn<Shift>[] = useMemo(
    () => [
      {
        key: "shiftNo",
        header: "Shift No",
        sortable: true,
        getSortValue: (row) => row.shiftNo,
        render: (row) => (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#0284C7]">{row.shiftNo}</span>
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
        sortable: true,
        getSortValue: (row) => new Date(row.openedAt).getTime(),
        render: (row) => (
          <div className="text-xs">
            <p className="font-medium text-gray-600">{dateTime(row.openedAt)}</p>
            <p className="text-[11px] text-gray-400">
              {row.closedAt ? `Closed: ${dateTime(row.closedAt)}` : "Ongoing shift"}
            </p>
          </div>
        ),
      },
      {
        key: "openingCash",
        header: "Opening Float",
        sortable: true,
        getSortValue: (row) => Number(row.openingCash) || 0,
        render: (row) => (
          <span className="font-mono text-xs font-semibold text-gray-600">{money(row.openingCash)}</span>
        ),
      },
      {
        key: "expectedCash",
        header: "Expected",
        sortable: true,
        getSortValue: (row) => Number(row.expectedCash) || 0,
        render: (row) => (
          <span className="font-mono text-xs font-semibold text-gray-600">
            {row.expectedCash != null ? money(row.expectedCash) : "—"}
          </span>
        ),
      },
      {
        key: "countedCash",
        header: "Counted",
        sortable: true,
        getSortValue: (row) => Number(row.countedCash) || 0,
        render: (row) => (
          <span className="font-mono text-xs font-semibold text-[#0284C7]">
            {row.countedCash != null ? money(row.countedCash) : "—"}
          </span>
        ),
      },
      {
        key: "variance",
        header: "Variance",
        sortable: true,
        getSortValue: (row) => Number(row.variance) || 0,
        render: (row) => {
          if (row.variance == null) return <span className="text-xs text-gray-400">—</span>;
          const v = Number(row.variance);
          const isZero = Math.abs(v) < 0.01;
          const isOverThreshold = Math.abs(v) > 500;
          return (
            <span
              className={`inline-flex items-center font-mono text-xs font-bold px-2 py-0.5 rounded-sm ${
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
        sortable: true,
        getSortValue: (row) => row.status,
        render: (row) => {
          if (row.status === "OPEN") {
            return (
              <span className="inline-flex items-center gap-1 rounded-sm bg-sky-50 px-2 py-0.5 text-xs font-semibold text-[#0284C7] border border-sky-200">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0284C7]"></span> Open
              </span>
            );
          }
          if (row.status === "PENDING_APPROVAL") {
            return (
              <span className="inline-flex items-center gap-1 rounded-sm bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                <Clock className="w-3 h-3" /> Needs Approval
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 rounded-sm bg-slate-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              <Check className="w-3 h-3 text-gray-400" /> Closed
            </span>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        render: (row) => (
          <div className="flex items-center gap-1.5">
            <CustomButton
              variant="outline"
              size="xs"
              leftIcon={<Eye className="w-3.5 h-3.5 text-[#0284C7]" />}
              onClick={() => openDetail(row)}
            >
              Audit
            </CustomButton>

            {row.status === "PENDING_APPROVAL" && (
              <CustomButton
                variant="primary"
                size="xs"
                themeColor="amber"
                leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                onClick={() => setApproveConfirmShiftId(row.id)}
              >
                Approve
              </CustomButton>
            )}
          </div>
        ),
      },
    ],
    []
  );

  // Detail Modal Transaction Columns
  const txnColumns: CustomTableColumn<ShiftTxn>[] = useMemo(
    () => [
      {
        key: "type",
        header: "Type",
        sortable: true,
        getSortValue: (t) => t.type,
        render: (t) => {
          const meta = TXN_META[t.type] || TXN_META.CASH_IN;
          const Icon = meta.icon;
          return (
            <div className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-sm border ${meta.cls}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-gray-600">{meta.label}</span>
            </div>
          );
        },
      },
      {
        key: "createdAt",
        header: "Date & Time",
        sortable: true,
        getSortValue: (t) => new Date(t.createdAt).getTime(),
        render: (t) => <span className="text-xs text-gray-600">{dateTime(t.createdAt)}</span>,
      },
      {
        key: "note",
        header: "Remarks / Memo",
        sortable: true,
        getSortValue: (t) => t.note || "",
        render: (t) => <span className="text-xs text-gray-500">{t.note || "—"}</span>,
      },
      {
        key: "amount",
        header: "Amount",
        align: "right",
        sortable: true,
        getSortValue: (t) => Number(t.amount) || 0,
        render: (t) => {
          const meta = TXN_META[t.type] || TXN_META.CASH_IN;
          return (
            <span
              className={`font-mono text-xs font-bold ${
                meta.sign === "+" ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {meta.sign}
              {money(Number(t.amount))}
            </span>
          );
        },
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
        <div className="flex h-72 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-[#0284C7]" />
            <p className="text-sm font-medium text-gray-600">Loading cash register & drawer data...</p>
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
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 rounded-sm border px-4 py-3 text-sm font-medium shadow-lg animate-in slide-in-from-top duration-200 ${
            toast.ok
              ? "border-sky-200 bg-sky-50 text-[#0369A1]"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {toast.ok ? <CheckCircle2 className="w-5 h-5 text-[#0284C7]" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          {toast.text}
        </div>
      )}

      {/* ── Breadcrumb & Page Header ── */}
      <CustomBreadcrumb
        title="Cash Register & Shift Control"
        subtitle={`Branch: ${selectedBranchName} · Daily Cash Drawer Reconciliation & Audit Ledger`}
        icon={<Wallet className="w-5 h-5" />}
        items={[
          { label: "POS", href: "/retail-pos" },
          { label: "Cash Register" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {branches.length > 0 && (
              <div className="w-48">
                <CustomSelect
                  value={branchId}
                  onChange={(e) => {
                    setBranchId(e.target.value);
                    setPage(1);
                  }}
                  options={branches.map((b) => ({
                    label: `📍 ${b.name}`,
                    value: b.id,
                  }))}
                />
              </div>
            )}

            <CustomButton
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#0284C7]" : ""}`} />}
              onClick={handleRefresh}
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
                variant="danger"
                size="sm"
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
        <div className="rounded-sm border border-dashed border-sky-200 bg-white p-10 text-center shadow-2xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-sm bg-sky-50 text-[#0284C7] border border-sky-200">
            <Lock className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-600">No Shift Currently Open for {selectedBranchName}</h3>
          <p className="mt-1.5 max-w-md mx-auto text-sm text-gray-500">
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
          <div className="rounded-sm border border-sky-100/90 bg-white p-5 shadow-2xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-sky-100/90 pb-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-sm ${
                    shift!.status === "OPEN"
                      ? "bg-sky-50 text-[#0284C7] border border-sky-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {shift!.status === "OPEN" ? <Unlock className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-base font-bold text-[#0284C7]">{shift!.shiftNo}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-sm px-2.5 py-0.5 text-xs font-semibold ${
                        shift!.status === "OPEN"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                      {shift!.status === "OPEN" ? "ACTIVE & SELLING" : "AWAITING MANAGER APPROVAL"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Opened at <span className="font-medium text-gray-600">{dateTime(shift!.openedAt)}</span> · Initial Float:{" "}
                    <span className="font-medium text-[#0284C7]">{money(shift!.openingCash)}</span>
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <CustomButton
                  variant="outline"
                  size="sm"
                  icon={<ArrowDownToLine className="w-4 h-4 text-[#0284C7]" />}
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
                  icon={<FileText className="w-4 h-4 text-gray-600" />}
                  onClick={() => {
                    if (current?.shift) {
                      openDetail(current.shift);
                    }
                  }}
                >
                  Audit Ledger
                </CustomButton>

                <CustomButton
                  variant="danger"
                  size="sm"
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
                <div className="rounded-sm border border-slate-200/80 bg-slate-50/70 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Opening Float</p>
                  <p className="mt-1 text-sm font-bold text-gray-600 tabular-nums">{money(summary.openingCash)}</p>
                </div>

                <div className="rounded-sm border border-emerald-100 bg-emerald-50/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Cash Sales (+)</p>
                  <p className="mt-1 text-sm font-bold text-emerald-700 tabular-nums">{money(summary.cashSales)}</p>
                </div>

                <div className="rounded-sm border border-sky-100 bg-sky-50/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0284C7]">Cash In (+)</p>
                  <p className="mt-1 text-sm font-bold text-[#0284C7] tabular-nums">
                    {money(summary.cashIn + summary.customerPaymentsIn)}
                  </p>
                </div>

                <div className="rounded-sm border border-indigo-100 bg-indigo-50/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">Cash Out (-)</p>
                  <p className="mt-1 text-sm font-bold text-indigo-700 tabular-nums">{money(summary.cashOut)}</p>
                </div>

                <div className="rounded-sm border border-amber-100 bg-amber-50/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Expenses (-)</p>
                  <p className="mt-1 text-sm font-bold text-amber-700 tabular-nums">{money(summary.cashExpenses)}</p>
                </div>

                <div className="rounded-sm border border-rose-100 bg-rose-50/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Refunds (-)</p>
                  <p className="mt-1 text-sm font-bold text-rose-700 tabular-nums">{money(summary.cashRefunds)}</p>
                </div>
              </div>
            )}

            {/* Expected Cash in Drawer Hero Strip */}
            {summary && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between rounded-sm bg-gradient-to-r from-slate-900 to-sky-950 px-5 py-4 text-white shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-white/10 text-sky-300">
                    <Scale className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-300">Calculated Cash in Drawer (Current)</p>
                    <p className="text-[11px] text-sky-200">Float + Inflows - Outflows</p>
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-sm border border-amber-200 bg-amber-50/80 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-amber-100 text-amber-700">
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
                themeColor="amber"
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
      <div className="rounded-sm border border-sky-100/90 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100/90 pb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#0284C7]" />
            <h3 className="text-base font-bold text-gray-600">Shift History & Reconciliation Audit</h3>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-56">
              <CustomInput
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search Shift # or note..."
                leftIcon={<Search className="h-3.5 w-3.5 text-[#0284C7]" />}
                rounded="sm"
              />
            </div>

            <div className="w-44">
              <CustomSelect
                value={historyStatusFilter}
                onChange={(e) => {
                  setHistoryStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { label: "All Statuses", value: "ALL" },
                  { label: "Open", value: "OPEN" },
                  { label: "Pending Approval", value: "PENDING_APPROVAL" },
                  { label: "Closed", value: "CLOSED" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Server-Side Paginated & Sortable Shift Table */}
        <CustomTable<Shift>
          columns={historyColumns}
          data={history}
          loading={historyLoading}
          totalItems={totalHistory}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          showPagination={true}
          emptyMessage="No shift history found."
        />
      </div>

      {/* ─── MODAL: OPEN SHIFT ─── */}
      <CustomModal open={openModal} onClose={() => setOpenModal(false)} title="Open New Cash Register Shift" size="md">
        <form onSubmit={handleOpenShift} className="space-y-4">
          <div className="rounded-sm bg-sky-50 border border-sky-200/90 p-3.5 text-xs text-[#0369A1] flex items-start gap-2.5">
            <PlayCircle className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Starting a New POS Selling Session</p>
              <p className="text-sky-700 mt-0.5">
                The opening cash float balance will be recorded in the register drawer for branch{" "}
                <span className="font-semibold">{selectedBranchName}</span>.
              </p>
            </div>
          </div>

          <div>
            <CustomInput
              label="Opening Float Balance (Tk) *"
              type="number"
              min="0"
              step="any"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              placeholder="5000"
              rounded="sm"
              autoFocus
              required
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[1000, 2000, 5000, 10000].map((amt) => (
                <CustomButton
                  key={amt}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setOpeningCash(String(amt))}
                >
                  +{money(amt)}
                </CustomButton>
              ))}
            </div>
          </div>

          <div>
            <CustomInput
              label="Opening Remarks / Cashier Notes (Optional)"
              type="text"
              value={openShiftNote}
              onChange={(e) => setOpenShiftNote(e.target.value)}
              placeholder="e.g. Morning shift counter 1 opening"
              rounded="sm"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-sky-100/90">
            <CustomButton variant="outline" size="sm" onClick={() => setOpenModal(false)} type="button">
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              icon={<PlayCircle className="w-4 h-4" />}
              type="submit"
              disabled={busy}
              loading={busy}
            >
              Confirm & Open Shift
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
            className={`rounded-sm border p-3.5 text-xs flex items-start gap-2.5 ${
              cashMoveModal === "in"
                ? "bg-sky-50/80 border-sky-200 text-[#0369A1]"
                : "bg-indigo-50/70 border-indigo-200 text-indigo-900"
            }`}
          >
            {cashMoveModal === "in" ? (
              <ArrowDownToLine className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
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
            <CustomInput
              label="Amount (Tk) *"
              type="number"
              min="1"
              step="any"
              value={cashMoveAmount}
              onChange={(e) => setCashMoveAmount(e.target.value)}
              placeholder="1000"
              rounded="sm"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold capitalize text-[#0369A1] mb-1.5">
              Quick Category / Reason
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(cashMoveModal === "in"
                ? ["Float Top-up", "Change Replenish", "Owner Capital In", "Bank Cash Draw"]
                : ["Bank Drop", "Safe Transfer", "Supplier Cash Pay", "Owner Draw", "Emergency Expense"]
              ).map((reason) => (
                <CustomButton
                  key={reason}
                  type="button"
                  variant={cashMoveReason === reason ? "primary" : "outline"}
                  size="xs"
                  onClick={() => setCashMoveReason(reason)}
                >
                  {reason}
                </CustomButton>
              ))}
            </div>
            <CustomInput
              label="Additional Memo / Reference"
              type="text"
              value={cashMoveNote}
              onChange={(e) => setCashMoveNote(e.target.value)}
              placeholder="Additional memo or reference..."
              rounded="sm"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-sky-100/90">
            <CustomButton variant="outline" size="sm" onClick={() => setCashMoveModal(null)} type="button">
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              type="submit"
              disabled={busy}
              loading={busy}
            >
              Record Cash {cashMoveModal === "in" ? "In" : "Out"}
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
              <div className="rounded-sm bg-gradient-to-r from-slate-900 to-sky-950 p-4 text-white shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-300">Expected Cash In Drawer</p>
                    <p className="text-[11px] text-sky-300">Float ({money(summary.openingCash)}) + Inflows - Outflows</p>
                  </div>
                  <p className="font-mono text-2xl font-bold text-white">{money(summary.expectedCash)}</p>
                </div>
              </div>
            )}

            {/* Counted Cash Input & Denominations Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold capitalize text-[#0369A1]">
                  Actual Counted Cash In Drawer (Tk) *
                </label>
                <CustomButton
                  variant="ghost"
                  size="xs"
                  leftIcon={<Calculator className="w-3.5 h-3.5" />}
                  onClick={() => setShowDenomCalc(!showDenomCalc)}
                  type="button"
                >
                  {showDenomCalc ? "Hide Denominations Tally" : "Open Denominations Tally"}
                </CustomButton>
              </div>

              <CustomInput
                type="number"
                min="0"
                step="any"
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                placeholder="Enter physical cash counted in drawer"
                rounded="sm"
                autoFocus
                required
              />

              {/* Denominations Calculator Grid */}
              {showDenomCalc && (
                <div className="mt-3 rounded-sm border border-sky-200/90 bg-sky-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-sky-200/80 pb-2">
                    <span className="text-xs font-bold text-gray-600">Cash Note / Coin Counter</span>
                    <span className="font-mono text-xs font-bold text-[#0284C7]">Tally Sum: {money(denomTotal)}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {DENOMINATIONS.map((d) => (
                      <div key={d} className="rounded-sm border border-sky-200/90 bg-white p-2 text-center">
                        <span className="text-[11px] font-bold text-gray-600">Tk {d}</span>
                        <input
                          type="number"
                          min="0"
                          value={denoms[d] || ""}
                          onChange={(e) => handleDenomChange(d, e.target.value)}
                          placeholder="0"
                          className="mt-1 w-full rounded-sm border border-sky-200/90 px-1.5 py-1 text-center font-mono text-xs focus:border-[#0284C7] focus:outline-hidden"
                        />
                        <span className="text-[10px] font-medium text-gray-400 block mt-0.5">
                          ={money(d * (denoms[d] || 0))}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <CustomButton
                      variant="outline"
                      size="xs"
                      onClick={resetDenoms}
                      type="button"
                    >
                      Clear Tally
                    </CustomButton>
                    <CustomButton
                      variant="primary"
                      size="sm"
                      type="button"
                      onClick={applyDenomToCounted}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Use Tally Total ({money(denomTotal)})
                    </CustomButton>
                  </div>
                </div>
              )}

              {/* Real-time Variance Calculation */}
              {summary && countedCash !== "" && (
                <div
                  className={`rounded-sm border p-3 text-xs flex items-center justify-between ${
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
              <div className="rounded-sm border border-amber-200 bg-amber-50/50 p-3.5 space-y-2">
                <CustomInput
                  label="Manager Authorization / User ID (Optional Override)"
                  type="text"
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value)}
                  placeholder="Enter Manager Username / User ID to instantly approve"
                  rounded="sm"
                />
                <p className="text-[11px] text-amber-700">
                  If left empty, this shift will close into <span className="font-semibold">PENDING_APPROVAL</span> status for manager sign-off.
                </p>
              </div>
            )}

            <div>
              <CustomTextarea
                label="Closing Remarks / End of Shift Notes"
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                rows={2}
                placeholder="Explain any cash discrepancy, safe drops, or shift handoff notes..."
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-sky-100/90">
              <CustomButton variant="outline" size="sm" onClick={() => setCloseModal(false)} type="button">
                Cancel
              </CustomButton>
              <CustomButton
                variant="danger"
                size="sm"
                icon={<XCircle className="w-4 h-4" />}
                type="submit"
                disabled={busy}
                loading={busy}
              >
                Confirm & Close Shift
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
        size="3xl"
      >
        {detail && (
          <div className="space-y-5">
            {/* Shift Header Meta */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm bg-sky-50/60 p-4 border border-sky-100/90">
              <div>
                <p className="text-xs text-gray-500">
                  Shift Period: <span className="font-semibold text-gray-600">{dateTime(detail.shift.openedAt)}</span> →{" "}
                  <span className="font-semibold text-gray-600">
                    {detail.shift.closedAt ? dateTime(detail.shift.closedAt) : "Active (Unclosed)"}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Status: <span className="font-semibold text-[#0284C7]">{detail.shift.status}</span> · Approved By:{" "}
                  <span className="font-semibold text-gray-600">{detail.shift.approvedBy || "N/A"}</span>
                </p>
              </div>

              <CustomButton
                variant="outline"
                size="sm"
                icon={<Printer className="w-4 h-4 text-[#0284C7]" />}
                onClick={handlePrintZReport}
              >
                Print Z-Report
              </CustomButton>
            </div>

            {/* Reconciliation KPI Strip */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-sm border border-sky-100/90 bg-white p-3 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Expected in Drawer</p>
                <p className="mt-1 font-mono text-base font-bold text-[#0284C7]">{money(detail.summary.expectedCash)}</p>
              </div>

              <div className="rounded-sm border border-sky-100/90 bg-white p-3 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Physical Counted</p>
                <p className="mt-1 font-mono text-base font-bold text-gray-600">
                  {detail.shift.countedCash != null ? money(detail.shift.countedCash) : "—"}
                </p>
              </div>

              <div
                className={`rounded-sm border p-3 shadow-2xs ${
                  detail.shift.variance != null && Math.abs(Number(detail.shift.variance)) > 0
                    ? "border-rose-200 bg-rose-50/70"
                    : "border-emerald-200 bg-emerald-50/70"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Reconciled Variance</p>
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

            {/* Transaction Ledger Table with CustomTable */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Itemized Cash Movements ({detail.txns.length})
              </h4>

              <CustomTable<ShiftTxn>
                columns={txnColumns}
                data={detail.txns}
                pageSize={10}
                showPagination={detail.txns.length > 10}
                emptyMessage="No individual transactions recorded in this shift yet."
              />
            </div>

            {/* Note & Remarks */}
            {detail.shift.note && (
              <div className="rounded-sm border border-sky-100/90 bg-sky-50/50 p-3 text-xs text-gray-600">
                <span className="font-semibold text-gray-600">Shift Notes: </span>
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
