"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowLeft,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  RefreshCw,
  Building2,
  Calendar,
  Receipt,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomTable,
  CustomStatCard,
} from "@/components/custom";
import { money, dateTime } from "@/lib/format";

interface Fund {
  id: string;
  branchId: string;
  balance: string | number;
}

interface Txn {
  id: string;
  type: string;
  amount: string | number;
  balanceAfter: string | number;
  note: string | null;
  createdAt: string;
}

const TXN_META: Record<string, { label: string; badgeCls: string; isPositive: boolean }> = {
  FUND: { label: "Cash Injection (Fund)", badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200", isPositive: true },
  EXPENSE: { label: "Disbursement (Expense)", badgeCls: "bg-rose-50 text-rose-700 border-rose-200", isPositive: false },
  REIMBURSE: { label: "Branch Reimbursement", badgeCls: "bg-blue-50 text-blue-700 border-blue-200", isPositive: false },
  RESETTLE: { label: "Shift Resettlement", badgeCls: "bg-purple-50 text-purple-700 border-purple-200", isPositive: true },
};

export default function PettyCashPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Modals
  const [modalMode, setModalMode] = useState<"fund" | "reimburse" | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load branches
  useEffect(() => {
    (async () => {
      try {
        const brRes = await api.get<{ data: any }>("/branches");
        const brs = (brRes.data as any)?.data ?? brRes.data ?? [];
        const list = Array.isArray(brs) ? brs.map((b: any) => ({ id: b.id, name: b.name })) : [];
        setBranches(list);
        if (list.length > 0 && !branchId) {
          setBranchId(list[0].id);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [branchId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = branchId ? `?branchId=${branchId}` : "";
      const res = await api.get<{ data: { funds: Fund[]; recentTxns: Txn[] } }>(`/expenses/petty-cash${params}`);
      setFunds(res.data?.funds || []);
      setTxns(res.data?.recentTxns || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load petty cash records", "error");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFundOrReimburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalMode || !branchId) {
      setModalError("Please select a branch outlet.");
      return;
    }
    const num = Number(amount);
    if (!num || num <= 0) {
      setModalError("Please enter a valid positive amount.");
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      const endpoint = modalMode === "fund" ? "/expenses/petty-cash/fund" : "/expenses/petty-cash/reimburse";
      await api.post(endpoint, {
        branchId,
        amount: num,
        note: note.trim() || undefined,
      });

      setModalMode(null);
      setAmount("");
      setNote("");
      showToast(modalMode === "fund" ? `Petty cash funded with ${money(num)}` : `Reimbursement recorded for ${money(num)}`);
      await loadData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || err.message || "Transaction failed");
    } finally {
      setSaving(false);
    }
  };

  const currentFund = funds.find((f) => f.branchId === branchId);
  const currentBalance = Number(currentFund?.balance ?? 0);

  // Filtered transactions
  const filteredTxns = useMemo(() => {
    return txns.filter((t) => {
      const matchesSearch = (t.note || "").toLowerCase().includes(search.toLowerCase()) || t.type.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "ALL" || t.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [txns, search, typeFilter]);

  const totalFunded = txns.filter((t) => t.type === "FUND").reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const totalExpensed = txns.filter((t) => t.type === "EXPENSE" || t.type === "REIMBURSE").reduce((acc, t) => acc + Number(t.amount || 0), 0);

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-xl transition-all duration-300 ${
            toast.type === "success"
              ? "bg-slate-900 text-white border border-slate-700"
              : "bg-red-600 text-white border border-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="text-white" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Application Breadcrumb Header */}
      <CustomBreadcrumb
        title="Petty Cash Ledger"
        icon={<Wallet size={20} />}
        items={[
          { label: "Expenses", href: "/expenses" },
          { label: "Petty Cash" },
        ]}
        description="Branch-level cash float management, real-time receipts, reimbursement logs, and balance audit."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/expenses">
              <CustomButton
                size="sm"
                variant="outline"
                leftIcon={<Receipt size={14} />}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                All Expenses
              </CustomButton>
            </Link>
            <CustomButton
              size="sm"
              leftIcon={<ArrowDownToLine size={14} />}
              onClick={() => {
                setModalMode("fund");
                setAmount("");
                setNote("");
                setModalError(null);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
            >
              Fund Petty Cash
            </CustomButton>
            <CustomButton
              size="sm"
              variant="outline"
              leftIcon={<ArrowUpFromLine size={14} />}
              onClick={() => {
                setModalMode("reimburse");
                setAmount("");
                setNote("");
                setModalError(null);
              }}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Reimburse Float
            </CustomButton>
            <button
              onClick={() => loadData()}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition shadow-2xs"
              title="Refresh Ledger"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        }
      />

      {/* Branch Selector & Active Float Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-md border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-teal-600" />
          <span className="text-xs font-bold text-slate-700">Select Outlet / Branch Float:</span>
          {branches.length > 0 ? (
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-slate-400">Loading branch outlets...</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Available Cash Float:</span>
          <span className="font-black text-sm text-teal-700 tabular-nums">
            {money(currentBalance)}
          </span>
        </div>
      </div>

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CustomStatCard
          label="Current Float Balance"
          value={money(currentBalance)}
          icon={Wallet}
          tone="primary"
        />
        <CustomStatCard
          label="Total Inflows (Funded)"
          value={money(totalFunded)}
          icon={TrendingUp}
          tone="green"
        />
        <CustomStatCard
          label="Total Outflows"
          value={money(totalExpensed)}
          icon={TrendingDown}
          tone="amber"
        />
        <CustomStatCard
          label="Recorded Ledger Txns"
          value={String(txns.length)}
          icon={Receipt}
          tone="blue"
        />
      </div>

      {/* Transactions Ledger Table Container */}
      <div className="bg-white rounded-md border border-slate-200 p-4 shadow-2xs space-y-3">
        {/* Search & Multi-Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search ledger by notes or transaction type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs font-medium text-gray-600 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            >
              <option value="ALL">All Transaction Types</option>
              <option value="FUND">Cash Injection (Fund)</option>
              <option value="EXPENSE">Disbursement (Expense)</option>
              <option value="REIMBURSE">Branch Reimbursement</option>
              <option value="RESETTLE">Shift Resettlement</option>
            </select>
          </div>
        </div>

        {/* Custom Table */}
        <CustomTable
          columns={[
            {
              key: "date",
              header: "Timestamp",
              render: (t: Txn) => (
                <span className="text-xs text-slate-600 font-medium">
                  {dateTime(t.createdAt)}
                </span>
              ),
            },
            {
              key: "type",
              header: "Movement Type",
              align: "center",
              render: (t: Txn) => {
                const meta = TXN_META[t.type] || {
                  label: t.type,
                  badgeCls: "bg-slate-100 text-slate-700 border-slate-200",
                  isPositive: false,
                };
                return (
                  <span
                    className={`inline-flex rounded-md px-2.5 py-0.5 text-[11px] font-semibold border ${meta.badgeCls}`}
                  >
                    {meta.label}
                  </span>
                );
              },
            },
            {
              key: "note",
              header: "Description / Reason",
              render: (t: Txn) => (
                <span className="text-xs font-semibold text-slate-800">
                  {t.note || "Petty cash movement"}
                </span>
              ),
            },
            {
              key: "amount",
              header: "Transaction Amount",
              align: "right",
              render: (t: Txn) => {
                const meta = TXN_META[t.type];
                const isPos = meta?.isPositive;
                return (
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      isPos ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {isPos ? "+" : "-"}{money(Number(t.amount) || 0)}
                  </span>
                );
              },
            },
            {
              key: "balanceAfter",
              header: "Running Balance After",
              align: "right",
              render: (t: Txn) => (
                <span className="text-xs font-black text-slate-900 tabular-nums">
                  {money(Number(t.balanceAfter) || 0)}
                </span>
              ),
            },
          ]}
          data={filteredTxns}
          rowKey={(t: Txn) => t.id}
          loading={loading}
          emptyIcon={Wallet}
          emptyMessage="No petty cash movements recorded for this branch yet."
        />
      </div>

      {/* ──────────────── FUND / REIMBURSE MODAL ──────────────── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto" onClick={() => setModalMode(null)}>
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl border border-slate-200 transition-all my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-700">
                  {modalMode === "fund" ? "Fund Petty Cash Float" : "Reimburse Petty Cash"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {modalMode === "fund"
                    ? "Deposit cash into the branch petty float from main treasury."
                    : "Withdraw spent receipts and replenish the cash balance."}
                </p>
              </div>
              <button onClick={() => setModalMode(null)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <XCircle size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-red-500" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleFundOrReimburse} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Amount (৳) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition tabular-nums"
                  placeholder="5000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Narration / Audit Reference Note
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
                  placeholder={modalMode === "fund" ? "e.g. Monthly float replenishment from central bank" : "e.g. Replenishment against food & stationery receipts"}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <CustomButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalMode(null)}
                  className="text-xs font-semibold"
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  type="submit"
                  size="sm"
                  loading={saving}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
                >
                  {modalMode === "fund" ? "Confirm Funding" : "Confirm Reimbursement"}
                </CustomButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
