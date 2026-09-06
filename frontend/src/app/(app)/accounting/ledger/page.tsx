"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Book, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { CustomTable, CustomSelect } from "@/components/custom";
import { money, dateTime } from "@/lib/format";

interface LedgerEntry {
  entryDate: string; debit: string | number; credit: string | number; memo: string;
  journalNo: string; refType: string; refId: string; runningBalance?: number;
  accountCode?: string; accountName?: string;
}
interface Account { id: string; code: string; name: string; accountType: string }
interface LedgerResp { account?: { id: string; code: string; name: string; accountType: string }; entries: LedgerEntry[] }

export default function LedgerPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await api.get<{ data: Account[] }>("/accounting/accounts");
      setAccounts(res.data);
    } catch { /* non-fatal */ }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = selected ? `?accountId=${selected}` : "";
      const res = await api.get<{ data: LedgerResp | LedgerEntry[] }>(`/accounting/ledger${q}`);
      const data = res.data;
      setEntries(Array.isArray(data) ? data : data.entries ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => { load(); }, [load]);

  const isPerAccount = !!selected;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Book size={19} /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">General Ledger</h1>
            <p className="text-sm text-gray-500">Posted entries with running balances</p>
          </div>
        </div>
        <div className="w-full sm:w-72">
          <CustomSelect value={selected} onChange={(e) => setSelected(e.target.value)} placeholder="All accounts (summary)" options={accounts.map((a) => ({ label: `${a.code} — ${a.name}`, value: a.id }))} />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {isPerAccount ? (
          <CustomTable
            columns={[
              { key: "date", header: "Date", render: (e) => <span className="text-xs text-gray-500">{dateTime(e.entryDate)}</span> },
              { key: "journal", header: "Journal", render: (e) => <span className="font-mono text-xs text-primary-700">{e.journalNo}</span> },
              { key: "memo", header: "Memo", render: (e) => <span className="text-sm text-gray-600">{e.memo || e.refType}</span> },
              { key: "debit", header: "Debit", align: "right", render: (e) => <span className="tabular-nums text-gray-700">{Number(e.debit) > 0 ? money(Number(e.debit)) : "—"}</span> },
              { key: "credit", header: "Credit", align: "right", render: (e) => <span className="tabular-nums text-gray-700">{Number(e.credit) > 0 ? money(Number(e.credit)) : "—"}</span> },
              { key: "bal", header: "Balance", align: "right", render: (e) => <span className="font-semibold tabular-nums text-gray-900">{money(Number(e.runningBalance ?? 0))}</span> },
            ]}
            data={entries}
            rowKey={(e) => `${e.journalNo}-${e.refId}-${e.memo ?? ""}`}
            loading={loading}
            emptyIcon={Book}
            emptyMessage="No ledger entries for this account."
          />
        ) : (
          <CustomTable
            columns={[
              { key: "date", header: "Date", render: (e) => <span className="text-xs text-gray-500">{dateTime(e.entryDate)}</span> },
              { key: "account", header: "Account", render: (e) => <span className="text-sm text-gray-700">{e.accountCode} — {e.accountName}</span> },
              { key: "journal", header: "Journal", render: (e) => <span className="font-mono text-xs text-primary-700">{e.journalNo}</span> },
              { key: "debit", header: "Debit", align: "right", render: (e) => <span className="tabular-nums text-gray-700">{Number(e.debit) > 0 ? money(Number(e.debit)) : "—"}</span> },
              { key: "credit", header: "Credit", align: "right", render: (e) => <span className="tabular-nums text-gray-700">{Number(e.credit) > 0 ? money(Number(e.credit)) : "—"}</span> },
            ]}
            data={entries}
            rowKey={(e) => `${e.journalNo}-${e.accountCode ?? ""}-${e.memo ?? ""}`}
            loading={loading}
            emptyIcon={Book}
            emptyMessage="No ledger entries yet — post a sale or journal."
          />
        )}
      </div>
    </div>
  );
}
