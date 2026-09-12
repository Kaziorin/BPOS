"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  Receipt,
  ArrowLeft,
  Calendar,
  DollarSign,
  Download,
  Printer,
  FileSpreadsheet,
  Layers,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Search,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomTable,
  CustomStatCard,
} from "@/components/custom";
import { money, dateOnly } from "@/lib/format";

interface Expense {
  id: string;
  title: string;
  amount: string | number;
  expenseDate: string;
  status: string;
  paymentMethod?: string;
  category?: { name: string } | null;
}

interface Report {
  total: number;
  count: number;
  byCategory: { categoryName: string; total: number; count: number }[];
  expenses: Expense[];
}

export default function ExpenseReportPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await api.get<{ data: Report }>(`/expenses/report?${params}`);
      setReport(res.data || null);
    } catch (err: any) {
      console.error("Failed to load report", err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const setPreset = (type: "thisMonth" | "lastMonth" | "last90" | "thisYear") => {
    const now = new Date();
    if (type === "thisMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setFrom(firstDay.toISOString().split("T")[0]);
      setTo(now.toISOString().split("T")[0]);
    } else if (type === "lastMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      setFrom(firstDay.toISOString().split("T")[0]);
      setTo(lastDay.toISOString().split("T")[0]);
    } else if (type === "last90") {
      const past = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      setFrom(past.toISOString().split("T")[0]);
      setTo(now.toISOString().split("T")[0]);
    } else if (type === "thisYear") {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      setFrom(firstDay.toISOString().split("T")[0]);
      setTo(now.toISOString().split("T")[0]);
    }
  };

  const handleExportCSV = () => {
    if (!report || !report.expenses.length) return;
    const headers = ["Expense Title", "Category", "Date", "Payment Method", "Status", "Amount (BDT)"];
    const rows = report.expenses.map((e) => [
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category?.name || "Uncategorized"}"`,
      `"${dateOnly(e.expenseDate)}"`,
      `"${e.paymentMethod || "CASH"}"`,
      `"${e.status}"`,
      Number(e.amount) || 0,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encoded = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `expense_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const maxCatTotal = report ? Math.max(...report.byCategory.map((c) => c.total), 1) : 1;
  const avgExpense = report && report.count > 0 ? report.total / report.count : 0;
  const topCat = report?.byCategory?.[0];

  // Filter line items
  const filteredLineItems = useMemo(() => {
    if (!report?.expenses) return [];
    return report.expenses.filter((e) => {
      return (
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.category?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        e.status.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [report, search]);

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* Application Breadcrumb Header */}
      <CustomBreadcrumb
        title="Expense Reports & Analytics"
        icon={<BarChart3 size={20} />}
        items={[
          { label: "Expenses", href: "/expenses" },
          { label: "Reports & Analytics" },
        ]}
        description="Comprehensive analysis of operational expenditures, category budget allocation, and CSV export."
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
              variant="outline"
              leftIcon={<FileSpreadsheet size={14} className="text-emerald-600" />}
              onClick={handleExportCSV}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Export CSV
            </CustomButton>
            <CustomButton
              size="sm"
              variant="outline"
              leftIcon={<Printer size={14} />}
              onClick={handlePrint}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Print
            </CustomButton>
            <button
              onClick={() => loadReport()}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition shadow-2xs"
              title="Refresh Analytics"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        }
      />

      {/* Date Filter & Preset Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-md border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar size={14} className="text-teal-600" />
            <span>Date Range:</span>
          </div>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none"
          />
          <CustomButton
            size="sm"
            onClick={loadReport}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold px-3 py-1"
          >
            Filter
          </CustomButton>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPreset("thisMonth")}
            className="rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition"
          >
            This Month
          </button>
          <button
            onClick={() => setPreset("lastMonth")}
            className="rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition"
          >
            Last Month
          </button>
          <button
            onClick={() => setPreset("last90")}
            className="rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition"
          >
            Last 90 Days
          </button>
          <button
            onClick={() => setPreset("thisYear")}
            className="rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition"
          >
            This Year
          </button>
        </div>
      </div>

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CustomStatCard
          label="Total Expenses (Period)"
          value={report ? money(report.total) : "—"}
          icon={DollarSign}
          tone="primary"
        />
        <CustomStatCard
          label="Recorded Vouchers"
          value={report ? String(report.count) : "—"}
          icon={Receipt}
          tone="blue"
        />
        <CustomStatCard
          label="Average Ticket / Entry"
          value={report ? money(avgExpense) : "—"}
          icon={TrendingUp}
          tone="amber"
        />
        <CustomStatCard
          label="Top Category"
          value={topCat ? topCat.categoryName : "None"}
          icon={Layers}
          tone="green"
        />
      </div>

      {/* Visual Category Allocations */}
      {report && report.byCategory.length > 0 && (
        <div className="bg-white rounded-md border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-teal-600" />
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Category Spending Distribution
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {report.byCategory.length} active spending heads
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {report.byCategory
              .sort((a, b) => b.total - a.total)
              .map((c) => {
                const pct = report.total > 0 ? ((c.total / report.total) * 100).toFixed(1) : "0";
                return (
                  <div key={c.categoryName} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-slate-800 font-semibold">
                        {c.categoryName} <span className="text-slate-400 font-normal">({c.count} transactions)</span>
                      </span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {money(c.total)} <span className="text-teal-700 font-bold">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-teal-600 transition-all duration-500"
                        style={{ width: `${(c.total / maxCatTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Line Items Table Container */}
      <div className="bg-white rounded-md border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-teal-600" />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Itemized Expense Entries ({filteredLineItems.length})
            </h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search line items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs font-medium text-gray-600 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            />
          </div>
        </div>

        <CustomTable
          columns={[
            {
              key: "title",
              header: "Expense Item",
              render: (e: Expense) => (
                <span className="font-bold text-slate-800 text-xs">{e.title}</span>
              ),
            },
            {
              key: "category",
              header: "Category",
              align: "center",
              render: (e: Expense) => (
                <span className="inline-flex rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 border border-teal-200">
                  {e.category?.name || "Uncategorized"}
                </span>
              ),
            },
            {
              key: "date",
              header: "Expense Date",
              align: "center",
              render: (e: Expense) => (
                <span className="text-xs text-slate-600 font-medium">
                  {dateOnly(e.expenseDate)}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              align: "center",
              render: (e: Expense) => (
                <span className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {e.status}
                </span>
              ),
            },
            {
              key: "amount",
              header: "Amount",
              align: "right",
              render: (e: Expense) => (
                <span className="font-bold text-slate-900 text-xs tabular-nums">
                  {money(Number(e.amount) || 0)}
                </span>
              ),
            },
          ]}
          data={filteredLineItems}
          rowKey={(e: Expense) => e.id}
          loading={loading}
          emptyIcon={Receipt}
          emptyMessage="No expenses recorded for the selected date range."
        />
      </div>
    </div>
  );
}
