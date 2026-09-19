"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { CustomTable, CustomBadge, CustomButton, CustomBreadcrumb } from "@/components/custom";
import { money } from "@/lib/format";

interface Account {
  id: string; code: string; name: string; accountType: string;
  isGroup: number; status: string; balance: number; openingBalance: string;
  parent?: { id: string; code: string; name: string } | null;
}

const TYPE_TONE: Record<string, "primary" | "green" | "amber" | "red" | "gray"> = {
  ASSET: "primary", LIABILITY: "amber", EQUITY: "green", REVENUE: "green", EXPENSE: "red",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: Account[] }>("/accounting/accounts");
      setAccounts(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load chart of accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="w-full max-w-full space-y-4">
      <CustomBreadcrumb
        title="Chart of Accounts"
        subtitle={`${accounts.length} accounts · auto-seeded COA (§10.20)`}
        icon={<BookOpen size={18} />}
        breadcrumbs={[
          { label: "Accounting", href: "/accounting/accounts" },
          { label: "Chart of Accounts" },
        ]}
        actions={
          <Link href="/accounting/accounts/create">
            <CustomButton variant="primary" size="sm" leftIcon={<Plus size={15} />}>
              Add Account
            </CustomButton>
          </Link>
        }
      />

      {error && <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-2xs">
        <CustomTable
          columns={[
            { key: "code", header: "Code", render: (a) => <span className="font-mono text-xs font-semibold text-gray-600">{a.code}</span> },
            { key: "name", header: "Account", render: (a) => (
              <div>
                <p className="font-medium text-gray-600">{a.name}</p>
                {a.parent && <p className="text-[11px] text-gray-400">parent: {a.parent.name}</p>}
              </div>
            ) },
            { key: "type", header: "Type", render: (a) => <CustomBadge tone={TYPE_TONE[a.accountType] ?? "gray"}>{a.accountType}</CustomBadge> },
            { key: "group", header: "Group", render: (a) => (a.isGroup ? <CustomBadge tone="gray">Group</CustomBadge> : <span className="text-gray-300">—</span>) },
            { key: "balance", header: "Balance", align: "right", render: (a) => <span className="font-semibold tabular-nums text-gray-600">{money(a.balance)}</span> },
          ]}
          data={accounts}
          rowKey={(a) => a.id}
          loading={loading}
          emptyIcon={BookOpen}
          emptyMessage="No accounts yet — they are seeded on first view."
        />
      </div>
    </div>
  );
}
