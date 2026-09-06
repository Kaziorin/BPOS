"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen, BookMarked, Scale, BarChart3, FileText, Wallet,
  ArrowUpRight, ChevronRight, Landmark, TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomStatCard } from "@/components/custom";
import { money } from "@/lib/format";

interface TrialData { totalDebit: number; totalCredit: number; balanced: boolean; accounts: unknown[] }
interface PnlData { totalRevenue: number; totalExpenses: number; netProfit: number }
interface BsData { totalAssets: number; totalLiabilities: number; totalEquity: number; balanced: boolean }
interface Journal { id: string; journalNo: string; status: string; totalDebit: number }

const MODULES = [
  { href: "/accounting/accounts", label: "Chart of Accounts", desc: "View & manage the COA", icon: BookOpen },
  { href: "/accounting/journals", label: "Journals", desc: "Posted double-entry journals", icon: BookMarked },
  { href: "/accounting/ledger", label: "General Ledger", desc: "Per-account running balance", icon: Wallet },
  { href: "/accounting/trial-balance", label: "Trial Balance", desc: "Debit vs credit footing", icon: Scale },
  { href: "/accounting/pnl", label: "Profit & Loss", desc: "Revenue and expenses", icon: BarChart3 },
  { href: "/accounting/balance-sheet", label: "Balance Sheet", desc: "Assets, liabilities, equity", icon: FileText },
];

export default function AccountingPage() {
  const [trial, setTrial] = useState<TrialData | null>(null);
  const [pnl, setPnl] = useState<PnlData | null>(null);
  const [bs, setBs] = useState<BsData | null>(null);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, p, b, j] = await Promise.all([
        api.get<{ data: TrialData }>("/accounting/trial-balance"),
        api.get<{ data: PnlData }>("/accounting/profit-loss"),
        api.get<{ data: BsData }>("/accounting/balance-sheet"),
        api.get<{ data: Journal[] }>("/accounting/journals?limit=6"),
      ]);
      setTrial(t.data); setPnl(p.data); setBs(b.data); setJournals(j.data);
    } catch (err: any) {
      setError(err.message || "Failed to load accounting summary");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-ink-800 p-6 text-white shadow-md">
        <div>
          <p className="flex items-center gap-2 text-sm text-primary-100"><Landmark size={15} /> Accounting Engine</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Double-entry ledger, live financial statements</h1>
          <p className="mt-1 text-sm text-primary-200">Every sale, GRN, expense, supplier payment and installment posts a balanced journal (§10.20)</p>
        </div>
        <Link href="/accounting/journals/create" className="hidden items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium ring-1 ring-white/20 transition hover:bg-white/20 sm:inline-flex">
          New Journal <ArrowUpRight size={15} />
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CustomStatCard label="Net Profit (P&L)" value={loading ? "—" : money(pnl?.netProfit ?? 0)} icon={TrendingUp} tone={pnl && pnl.netProfit < 0 ? "red" : "green"} />
        <CustomStatCard label="Total Assets" value={loading ? "—" : money(bs?.totalAssets ?? 0)} icon={Wallet} tone="primary" />
        <CustomStatCard label="Total Liabilities" value={loading ? "—" : money(bs?.totalLiabilities ?? 0)} icon={FileText} tone="amber" />
        <CustomStatCard label="Trial Balance" value={loading ? "—" : (trial?.balanced ? "Balanced" : "Unbalanced")} icon={Scale} tone={trial?.balanced ? "green" : "red"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {MODULES.map((m) => (
            <Link key={m.href} href={m.href} className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><m.icon size={20} /></div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">{m.label}</p>
                <p className="truncate text-sm text-gray-500">{m.desc}</p>
              </div>
              <ChevronRight size={17} className="text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primary-500" />
            </Link>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900"><BookMarked size={16} className="text-primary-600" /> Recent Journals</h2>
            <Link href="/accounting/journals" className="text-xs font-medium text-primary-600 hover:underline">View all</Link>
          </div>
          <div className="max-h-96 divide-y divide-gray-50">
            {journals.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-400">No journals yet — post a sale or create one manually.</p>
            ) : (
              journals.map((j) => (
                <div key={j.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{j.journalNo}</p>
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">{j.status}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-gray-900">{money(j.totalDebit)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

