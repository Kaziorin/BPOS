"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface CustomerCredit {
  id: string;
  name: string;
  phone: string | null;
  creditLimit: number;
  currentDue: number;
  availableCredit: number;
  isOnCreditHold: boolean;
  creditHoldReason: string | null;
  creditPeriodDays: number | null;
  isOverLimit: boolean;
}

export default function CreditPage() {
  const [customers, setCustomers] = useState<CustomerCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "hold" | "overlimit">("all");
  const [selected, setSelected] = useState<CustomerCredit | null>(null);
  const [limitForm, setLimitForm] = useState({ creditLimit: "", creditPeriodDays: "" });
  const [holdForm, setHoldForm] = useState({ reason: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const params = filter === "hold" ? "?onHoldOnly=true" : filter === "overlimit" ? "?overLimitOnly=true" : "";
    const res = await api.get<{ data: CustomerCredit[] }>(`/api/v1/credit${params}`);
    setCustomers((res as any).data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const openCustomer = (c: CustomerCredit) => {
    setSelected(c);
    setLimitForm({ creditLimit: String(c.creditLimit), creditPeriodDays: String(c.creditPeriodDays ?? "") });
    setHoldForm({ reason: c.creditHoldReason ?? "" });
    setMsg("");
  };

  const saveLimit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.patch<unknown>(`/api/v1/credit/${selected.id}/limit`, {
        creditLimit: Number(limitForm.creditLimit),
        creditPeriodDays: limitForm.creditPeriodDays ? Number(limitForm.creditPeriodDays) : undefined,
      });
      setMsg("Credit limit updated ✓");
      load();
    } catch (e: any) { setMsg(e.message); }
    setSaving(false);
  };

  const toggleHold = async (onHold: boolean) => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post(`/api/v1/credit/${selected.id}/hold`, { onHold, reason: holdForm.reason });
      setMsg(`Credit hold ${onHold ? "placed" : "lifted"} ✓`);
      load();
    } catch (e: any) { setMsg(e.message); }
    setSaving(false);
  };

  const fmt = (n: number) => `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Credit Management</h1>
        <Link href="/credit/aging" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          Aging Report →
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "hold", "overlimit"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {f === "all" ? "All Customers" : f === "hold" ? "On Hold" : "Over Limit"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-right">Credit Limit</th>
              <th className="px-4 py-3 text-right">Current Due</th>
              <th className="px-4 py-3 text-right">Available</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No customers found</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.phone}</div>
                </td>
                <td className="px-4 py-3 text-right">{fmt(c.creditLimit)}</td>
                <td className={`px-4 py-3 text-right font-medium ${c.isOverLimit ? "text-red-600" : ""}`}>{fmt(c.currentDue)}</td>
                <td className={`px-4 py-3 text-right ${c.availableCredit <= 0 ? "text-red-500" : "text-green-600"}`}>{fmt(c.availableCredit)}</td>
                <td className="px-4 py-3 text-center">
                  {c.isOnCreditHold ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">On Hold</span>
                  ) : c.isOverLimit ? (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Over Limit</span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => openCustomer(c)} className="text-blue-600 hover:underline text-xs">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manage modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold">{selected.name}</h2>
                <p className="text-sm text-gray-500">{selected.phone}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            {msg && <div className={`text-sm px-3 py-2 rounded ${msg.includes("✓") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg}</div>}

            {/* Credit limit */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Credit Limit</h3>
              <div className="flex gap-2">
                <input type="number" placeholder="Credit Limit ৳" value={limitForm.creditLimit}
                  onChange={(e) => setLimitForm((p) => ({ ...p, creditLimit: e.target.value }))}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                <input type="number" placeholder="Period (days)" value={limitForm.creditPeriodDays}
                  onChange={(e) => setLimitForm((p) => ({ ...p, creditPeriodDays: e.target.value }))}
                  className="w-28 border rounded-lg px-3 py-2 text-sm" />
              </div>
              <button onClick={saveLimit} disabled={saving}
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                Update Limit
              </button>
            </div>

            {/* Credit hold */}
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-semibold text-sm">Credit Hold</h3>
              <input type="text" placeholder="Hold reason (optional)" value={holdForm.reason}
                onChange={(e) => setHoldForm({ reason: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button onClick={() => toggleHold(true)} disabled={saving || selected.isOnCreditHold}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-40">
                  Place Hold
                </button>
                <button onClick={() => toggleHold(false)} disabled={saving || !selected.isOnCreditHold}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-40">
                  Lift Hold
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
