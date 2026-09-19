"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Book, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { CustomTable, CustomSelect, CustomBreadcrumb } from "@/components/custom";
import { money, dateTime } from "@/lib/format";

interface Account { id: string; code: string; name: string; accountType: string }
interface LedgerEntry {
  journalNo: string; entryDate: string; refType: string; refId: string;
  memo: string; debit: number; credit: number; runningBalance?: number;
  accountCode?: string; accountName?: string;
}

export default function LedgerPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ data: Account[] }>("/accounting/accounts")
      .then((res) => setAccounts(res.data))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (selected) {
        const res = await api.get<{ data: LedgerEntry[] }>(`/accounting/accounts/${selected}/ledger`);
        setEntries(res.data);
      } else {
        const res = await api.get<{ data: LedgerEntry[] }>("/accounting/ledger");
        setEntries(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { load(); }, [load]);

  const isPerAccount = !!selected;

  return (
    <div className="w-full max-w-full space-y-4">
      <CustomBreadcrumb
        title="General Ledger"
        subtitle="Posted entries with running balances (§10.20)"
        icon={<Book size={18} />}
        breadcrumbs={[
          { label: "Accounting", href: "/accounting/accounts" },
          { label: "General Ledger" },
        ]}
        actions={
          <div className="w-full sm:w-72">
            <CustomSelect
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              placeholder="All accounts (summary)"
              options={accounts.map((a) => ({ label: `${a.code} — ${a.name}`, value: a.id }))}
            />
          </div>
        }
      />

      {error && <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-2xs">
        {isPerAccount ? (
          <CustomTable
            columns={[
              { key: "date", header: "Date", render: (e) => <span className="text-xs text-gray-500">{dateTime(e.entryDate)}</span> },
              { key: "journal", header: "Journal", render: (e) => <span className="font-mono text-xs text-sky-700">{e.journalNo}</span> },
              { key: "memo", header: "Memo", render: (e) => <span className="text-sm text-gray-600">{e.memo || e.refType}</span> },
              { key: "debit", header: "Debit", align: "right", render: (e) => <span className="tabular-nums text-gray-600">{Number(e.debit) > 0 ? money(Number(e.debit)) : "—"}</span> },
              { key: "credit", header: "Credit", align: "right", render: (e) => <span className="tabular-nums text-gray-600">{Number(e.credit) > 0 ? money(Number(e.credit)) : "—"}</span> },
              { key: "bal", header: "Balance", align: "right", render: (e) => <span className="font-semibold tabular-nums text-gray-600">{money(Number(e.runningBalance ?? 0))}</span> },
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
              { key: "account", header: "Account", render: (e) => <span className="text-sm text-gray-600">{e.accountCode} — {e.accountName}</span> },
              { key: "journal", header: "Journal", render: (e) => <span className="font-mono text-xs text-sky-700">{e.journalNo}</span> },
              { key: "debit", header: "Debit", align: "right", render: (e) => <span className="tabular-nums text-gray-600">{Number(e.debit) > 0 ? money(Number(e.debit)) : "—"}</span> },
              { key: "credit", header: "Credit", align: "right", render: (e) => <span className="tabular-nums text-gray-600">{Number(e.credit) > 0 ? money(Number(e.credit)) : "—"}</span> },
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
