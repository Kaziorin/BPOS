"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Schedule {
  id: string;
  sequenceNo: number;
  dueDate: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  lateFeeCharged: number;
  paidAmount: number;
  status: string;
  note: string | null;
}

interface Plan {
  id: string;
  planNo: string;
  customerId: string;
  financedAmount: number;
  downPayment: number;
  installmentCount: number;
  frequency: string;
  installmentAmount: number;
  interestRate: number;
  processingFee: number;
  totalInterest: number;
  totalPayable: number;
  paidTotal: number;
  startDate: string;
  status: string;
  customer: { id: string; name: string; phone: string | null };
  schedules: Schedule[];
}

const STATUS_COLORS: Record<string, string> = {
  DUE: "bg-yellow-100 text-yellow-700",
  PARTIAL: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  WAIVED: "bg-gray-100 text-gray-600",
};

export default function InstallmentsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [payForm, setPayForm] = useState({ scheduleId: "", amount: "", note: "" });
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerId: "", saleAmount: "", downPayment: "0", installmentCount: "10",
    frequency: "MONTHLY", interestRate: "0.18", processingFee: "0",
    lateFeePerDay: "0", gracePeriodDays: "0", earlySettlementDiscount: "0",
  });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await api.get<{ data: Plan[] }>("/api/v1/installments");
    setPlans((res as any).data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number) => `৳${Number(n).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`;
  const pct = (n: number) => `${(Number(n) * 100).toFixed(1)}%`;

  const createPlan = async () => {
    setSaving(true);
    setMsg("");
    try {
      await api.post("/api/v1/installments", {
        ...createForm,
        saleAmount: Number(createForm.saleAmount),
        downPayment: Number(createForm.downPayment),
        installmentCount: Number(createForm.installmentCount),
        interestRate: Number(createForm.interestRate),
        processingFee: Number(createForm.processingFee),
        lateFeePerDay: Number(createForm.lateFeePerDay),
        gracePeriodDays: Number(createForm.gracePeriodDays),
        earlySettlementDiscount: Number(createForm.earlySettlementDiscount),
      });
      setMsg("Plan created ✓");
      setShowCreate(false);
      load();
    } catch (e: any) { setMsg(e.message); }
    setSaving(false);
  };

  const paySchedule = async () => {
    if (!selected || !payForm.scheduleId || !payForm.amount) return;
    setSaving(true);
    try {
      await api.post(`/api/v1/installments/${selected.id}/pay`, {
        scheduleId: payForm.scheduleId,
        amount: Number(payForm.amount),
        note: payForm.note,
      });
      setMsg("Payment recorded ✓");
      setPayForm({ scheduleId: "", amount: "", note: "" });
      load();
    } catch (e: any) { setMsg(e.message); }
    setSaving(false);
  };

  const earlySettle = async () => {
    if (!selected) return;
    if (!confirm("Settle all remaining installments now?")) return;
    setSaving(true);
    try {
      const res = await api.post<{ data: { settlementAmount: number; discountAmount: number } }>(`/api/v1/installments/${selected.id}/settle`, {});
      setMsg(`Settled ✓ — paid ${fmt((res as any).data.settlementAmount)}, discount ${fmt((res as any).data.discountAmount)}`);
      load();
    } catch (e: any) { setMsg(e.message); }
    setSaving(false);
  };

  const reschedule = async () => {
    if (!selected || !rescheduleDate) return;
    setSaving(true);
    try {
      await api.post(`/api/v1/installments/${selected.id}/reschedule`, { newStartDate: rescheduleDate });
      setMsg("Rescheduled ✓");
      setRescheduleDate("");
      load();
    } catch (e: any) { setMsg(e.message); }
    setSaving(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Installment Plans</h1>
        <button onClick={() => { setShowCreate(true); setMsg(""); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          + New Plan
        </button>
      </div>

      {msg && <div className={`text-sm px-4 py-2 rounded-lg ${msg.includes("✓") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg}</div>}

      {/* Plans table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Plan No</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-right">Financed</th>
              <th className="px-4 py-3 text-right">EMI</th>
              <th className="px-4 py-3 text-center">Count</th>
              <th className="px-4 py-3 text-right">Paid</th>
              <th className="px-4 py-3 text-right">Remaining</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : plans.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No installment plans</td></tr>
            ) : plans.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{p.planNo}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{p.customer.name}</div>
                  <div className="text-xs text-gray-400">{p.customer.phone}</div>
                </td>
                <td className="px-4 py-3 text-right">{fmt(p.financedAmount)}</td>
                <td className="px-4 py-3 text-right">{fmt(p.installmentAmount)}</td>
                <td className="px-4 py-3 text-center">{p.installmentCount}×{p.frequency.charAt(0)}</td>
                <td className="px-4 py-3 text-right text-green-600">{fmt(p.paidTotal)}</td>
                <td className="px-4 py-3 text-right text-orange-600">{fmt(Number(p.totalPayable) - Number(p.paidTotal))}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === "ACTIVE" ? "bg-blue-100 text-blue-700" : p.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => { setSelected(p); setMsg(""); }}
                    className="text-blue-600 hover:underline text-xs">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Plan detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 p-6 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold">{selected.planNo}</h2>
                <p className="text-sm text-gray-500">{selected.customer.name} · {selected.frequency}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            {msg && <div className={`text-sm px-3 py-2 rounded ${msg.includes("✓") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg}</div>}

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              {[
                ["Financed", fmt(selected.financedAmount)],
                ["Down Payment", fmt(selected.downPayment)],
                ["EMI", fmt(selected.installmentAmount)],
                ["Interest Rate", pct(selected.interestRate)],
                ["Total Interest", fmt(selected.totalInterest)],
                ["Total Payable", fmt(selected.totalPayable)],
                ["Paid", fmt(selected.paidTotal)],
                ["Remaining", fmt(Number(selected.totalPayable) - Number(selected.paidTotal))],
                ["Status", selected.status],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">{k}</div>
                  <div className="font-semibold mt-0.5">{v}</div>
                </div>
              ))}
            </div>

            {/* Schedule table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Due Date</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-right">Principal</th>
                    <th className="px-3 py-2 text-right">Interest</th>
                    <th className="px-3 py-2 text-right">Late Fee</th>
                    <th className="px-3 py-2 text-right">Paid</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-center">Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selected.schedules.map((sc) => (
                    <tr key={sc.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{sc.sequenceNo}</td>
                      <td className="px-3 py-2">{new Date(sc.dueDate).toLocaleDateString("en-BD")}</td>
                      <td className="px-3 py-2 text-right">{fmt(sc.amount)}</td>
                      <td className="px-3 py-2 text-right text-blue-600">{fmt(sc.principalAmount)}</td>
                      <td className="px-3 py-2 text-right text-orange-600">{fmt(sc.interestAmount)}</td>
                      <td className="px-3 py-2 text-right text-red-600">{sc.lateFeeCharged > 0 ? fmt(sc.lateFeeCharged) : "—"}</td>
                      <td className="px-3 py-2 text-right text-green-600">{sc.paidAmount > 0 ? fmt(sc.paidAmount) : "—"}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[sc.status] ?? "bg-gray-100 text-gray-600"}`}>{sc.status}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {sc.status !== "PAID" && sc.status !== "WAIVED" && (
                          <button onClick={() => setPayForm({ scheduleId: sc.id, amount: String(Number(sc.amount) - Number(sc.paidAmount)), note: "" })}
                            className="text-blue-600 hover:underline">Pay</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pay form */}
            {payForm.scheduleId && (
              <div className="border-t pt-4 space-y-2">
                <h3 className="font-semibold text-sm">Record Payment</h3>
                <div className="flex gap-2">
                  <input type="number" placeholder="Amount ৳" value={payForm.amount}
                    onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                  <input type="text" placeholder="Note" value={payForm.note}
                    onChange={(e) => setPayForm((p) => ({ ...p, note: e.target.value }))}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                  <button onClick={paySchedule} disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                    Confirm
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            {selected.status === "ACTIVE" && (
              <div className="border-t pt-4 flex gap-3 flex-wrap">
                <button onClick={earlySettle} disabled={saving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
                  Early Settlement
                </button>
                <div className="flex gap-2 items-center">
                  <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm" />
                  <button onClick={reschedule} disabled={saving || !rescheduleDate}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50">
                    Reschedule
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create plan modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">New Installment Plan</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            {msg && <div className="text-sm px-3 py-2 rounded bg-red-50 text-red-700">{msg}</div>}

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Customer ID", key: "customerId", type: "text" },
                { label: "Sale Amount ৳", key: "saleAmount", type: "number" },
                { label: "Down Payment ৳", key: "downPayment", type: "number" },
                { label: "Installments", key: "installmentCount", type: "number" },
                { label: "Annual Interest Rate (0.18=18%)", key: "interestRate", type: "number" },
                { label: "Processing Fee ৳", key: "processingFee", type: "number" },
                { label: "Late Fee/Day ৳", key: "lateFeePerDay", type: "number" },
                { label: "Grace Period (days)", key: "gracePeriodDays", type: "number" },
                { label: "Early Settlement Discount %", key: "earlySettlementDiscount", type: "number" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input type={type} value={(createForm as any)[key]}
                    onChange={(e) => setCreateForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                <select value={createForm.frequency}
                  onChange={(e) => setCreateForm((p) => ({ ...p, frequency: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="MONTHLY">Monthly</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
            </div>

            {/* EMI preview */}
            {createForm.saleAmount && createForm.installmentCount && (
              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                <span className="text-blue-700 font-medium">EMI Preview: </span>
                <span className="text-blue-900 font-bold">
                  {(() => {
                    const p = Number(createForm.saleAmount) - Number(createForm.downPayment || 0);
                    const r = Number(createForm.interestRate || 0) / 12;
                    const n = Number(createForm.installmentCount);
                    if (r === 0) return `৳${(p / n).toFixed(2)}`;
                    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                    return `৳${emi.toFixed(2)}`;
                  })()}
                </span>
                <span className="text-blue-600 ml-2">× {createForm.installmentCount} {createForm.frequency.toLowerCase()}</span>
              </div>
            )}

            <button onClick={createPlan} disabled={saving}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Creating..." : "Create Plan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
