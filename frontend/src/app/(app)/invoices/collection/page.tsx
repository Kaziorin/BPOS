"use client";

import { useEffect, useState } from "react";
import { Plus, Target, TrendingUp, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

interface CollectionEntry {
  id: string;
  collectionNo: string;
  collectorId: string;
  method: string;
  amount: number;
  collectedAt: string;
  receiptNo?: string | null;
  isOffline: boolean;
  status: string;
  customer?: { id: string; name: string; phone?: string } | null;
  invoice?: { id: string; invoiceNo: string; total: number } | null;
}

interface CollectionSchedule {
  id: string;
  collectorId: string;
  scheduledAt: string;
  expectedAmount: number;
  collectedAmount: number;
  status: string;
  customer?: { id: string; name: string; phone?: string } | null;
  invoice?: { id: string; invoiceNo: string; total: number; paidTotal: number } | null;
}

interface Performance {
  collectorId: string;
  period: string;
  targetAmount: number;
  collectedAmount: number;
  achievementPct: number;
}

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: "bg-green-50 text-green-700",
  PENDING: "bg-yellow-50 text-yellow-700",
  PARTIAL: "bg-blue-50 text-blue-700",
  FAILED: "bg-red-50 text-red-600",
  MISSED: "bg-red-50 text-red-600",
};

export default function CollectionPage() {
  const [tab, setTab] = useState<"entries" | "schedules" | "performance">("entries");
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [performance, setPerformance] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showTarget, setShowTarget] = useState(false);

  const [entryForm, setEntryForm] = useState({ branchId: "", collectorId: "", customerId: "", invoiceId: "", method: "CASH", amount: 0, receiptNo: "", note: "", isOffline: false });
  const [schedForm, setSchedForm] = useState({ collectorId: "", customerId: "", invoiceId: "", scheduledAt: "", expectedAmount: 0, note: "" });
  const [targetForm, setTargetForm] = useState({ collectorId: "", period: "", targetAmount: 0, branchId: "" });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [e, s, p] = await Promise.all([
        api.get("/v1/invoices/collection/entries").then((r: any) => r.data.data ?? []),
        api.get("/v1/invoices/collection/schedules").then((r: any) => r.data.data ?? []),
        api.get("/v1/invoices/collection/performance").then((r: any) => r.data.data ?? []),
      ]);
      setEntries(e);
      setSchedules(s);
      setPerformance(p);
    } finally { setLoading(false); }
  }

  async function createEntry() {
    try {
      await api.post("/v1/invoices/collection/entries", { ...entryForm, amount: Number(entryForm.amount) });
      setShowCreate(false);
      await loadAll();
    } catch (e: any) { alert(e.response?.data?.error ?? e.message); }
  }

  async function createSchedule() {
    try {
      await api.post("/v1/invoices/collection/schedules", { ...schedForm, expectedAmount: Number(schedForm.expectedAmount), scheduledAt: new Date(schedForm.scheduledAt) });
      setShowSchedule(false);
      await loadAll();
    } catch (e: any) { alert(e.response?.data?.error ?? e.message); }
  }

  async function setTarget() {
    try {
      await api.post("/v1/invoices/collection/targets", { ...targetForm, targetAmount: Number(targetForm.targetAmount) });
      setShowTarget(false);
      await loadAll();
    } catch (e: any) { alert(e.response?.data?.error ?? e.message); }
  }

  const totalCollected = entries.reduce((s, e) => s + Number(e.amount), 0);
  const pendingSchedules = schedules.filter((s) => s.status === "PENDING").length;

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Collection Module</h1>
          <p className="text-sm text-gray-500">Collector entries · Schedules · Targets · Performance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTarget(true)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Target size={15} /> Set Target
          </button>
          <button onClick={() => setShowSchedule(true)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Clock size={15} /> Schedule
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">
            <Plus size={15} /> Record Collection
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Collected", value: `৳${totalCollected.toLocaleString()}`, icon: TrendingUp, color: "text-green-600" },
          { label: "Pending Schedules", value: pendingSchedules, icon: Clock, color: "text-yellow-600" },
          { label: "Collectors", value: new Set(entries.map((e) => e.collectorId)).size, icon: Target, color: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500"><s.icon size={15} className={s.color} />{s.label}</div>
            <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Create entry form */}
      {showCreate && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">Record Collection Entry</h2>
          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              { label: "Branch ID *", key: "branchId" }, { label: "Collector ID *", key: "collectorId" },
              { label: "Customer ID *", key: "customerId" }, { label: "Invoice ID", key: "invoiceId" },
              { label: "Method", key: "method" }, { label: "Amount *", key: "amount" },
              { label: "Receipt No", key: "receiptNo" }, { label: "Note", key: "note" },
            ].map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-gray-600">{f.label}</label>
                <input type={f.key === "amount" ? "number" : "text"} value={(entryForm as any)[f.key]}
                  onChange={(e) => setEntryForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            ))}
          </div>
          <label className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={entryForm.isOffline} onChange={(e) => setEntryForm((p) => ({ ...p, isOffline: e.target.checked }))} />
            Offline collection (sync pending — Prompt 19)
          </label>
          <div className="flex gap-2">
            <button onClick={createEntry} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Record</button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Schedule form */}
      {showSchedule && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">Schedule Collection Visit</h2>
          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              { label: "Collector ID *", key: "collectorId" }, { label: "Customer ID *", key: "customerId" },
              { label: "Invoice ID", key: "invoiceId" }, { label: "Scheduled At *", key: "scheduledAt", type: "datetime-local" },
              { label: "Expected Amount *", key: "expectedAmount", type: "number" }, { label: "Note", key: "note" },
            ].map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-gray-600">{f.label}</label>
                <input type={f.type ?? "text"} value={(schedForm as any)[f.key]}
                  onChange={(e) => setSchedForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={createSchedule} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Schedule</button>
            <button onClick={() => setShowSchedule(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Target form */}
      {showTarget && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">Set Collection Target</h2>
          <div className="mb-4 grid grid-cols-4 gap-3">
            {[
              { label: "Collector ID *", key: "collectorId" }, { label: "Period (YYYY-MM) *", key: "period" },
              { label: "Target Amount *", key: "targetAmount", type: "number" }, { label: "Branch ID", key: "branchId" },
            ].map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-gray-600">{f.label}</label>
                <input type={f.type ?? "text"} value={(targetForm as any)[f.key]}
                  onChange={(e) => setTargetForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={setTarget} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Set Target</button>
            <button onClick={() => setShowTarget(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1 w-fit">
        {(["entries", "schedules", "performance"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${tab === t ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
      ) : tab === "entries" ? (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          {entries.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No collection entries yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3">Collection No</th><th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Method</th>
                <th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-mono text-xs font-medium text-gray-700">
                      {e.collectionNo}
                      {e.isOffline && <span className="ml-1 rounded-full bg-orange-50 px-1.5 py-0.5 text-xs text-orange-600">offline</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{e.customer?.name ?? e.collectorId}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{e.invoice?.invoiceNo ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-500">{e.method}</td>
                    <td className="px-5 py-3 text-right font-medium text-green-700">৳{Number(e.amount).toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-500">{new Date(e.collectedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[e.status] ?? "bg-gray-100 text-gray-600"}`}>{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : tab === "schedules" ? (
        <div className="space-y-2">
          {schedules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">No schedules</div>
          ) : schedules.map((s) => (
            <div key={s.id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{s.customer?.name ?? s.collectorId}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[s.status] ?? "bg-gray-100 text-gray-600"}`}>{s.status}</span>
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {s.invoice?.invoiceNo && `Invoice: ${s.invoice.invoiceNo} · `}
                  Scheduled: {new Date(s.scheduledAt).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">৳{Number(s.expectedAmount).toLocaleString()}</p>
                {Number(s.collectedAmount) > 0 && (
                  <p className="text-xs text-green-600">Collected: ৳{Number(s.collectedAmount).toLocaleString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {performance.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">No performance data. Set targets first.</div>
          ) : performance.map((p) => (
            <div key={p.collectorId} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{p.collectorId}</p>
                  <p className="text-xs text-gray-500">Period: {p.period}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{p.achievementPct}%</p>
                  <p className="text-xs text-gray-500">৳{p.collectedAmount.toLocaleString()} / ৳{p.targetAmount.toLocaleString()}</p>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full transition-all ${p.achievementPct >= 100 ? "bg-green-500" : p.achievementPct >= 70 ? "bg-blue-500" : "bg-yellow-500"}`}
                  style={{ width: `${Math.min(p.achievementPct, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
