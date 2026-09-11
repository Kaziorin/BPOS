"use client";

import { useEffect, useState } from "react";
import { X, Loader2, DollarSign, CheckCircle2, Receipt, AlertCircle, CreditCard, Wallet, Building2, Banknote } from "lucide-react";
import { api } from "@/lib/api";

interface CollectDueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer: any | null;
}

export function CollectDueModal({ isOpen, onClose, onSuccess, customer }: CollectDueModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  useEffect(() => {
    if (customer && isOpen) {
      setAmount(customer.currentDue ? String(customer.currentDue) : "");
      setPaymentMethod("CASH");
      setNote("");
      setError(null);
      setSuccessReceipt(null);
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const currDue = Number(customer.currentDue || 0);

  async function handleCollect(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post<any>(`/v1/customers/${customer.id}/collect-due`, {
        amount: numAmount,
        paymentMethod,
        note,
      });

      setSuccessReceipt({
        amount: numAmount,
        previousDue: currDue,
        remainingDue: Math.max(0, currDue - numAmount),
        paymentMethod,
        customerName: customer.name,
        date: new Date().toLocaleString(),
      });
      onSuccess();
    } catch (err: any) {
      console.error("Collect due error:", err);
      setError(err.response?.data?.error || err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  }

  const paymentMethods = [
    { id: "CASH", label: "Cash", icon: Banknote },
    { id: "BKASH", label: "bKash", icon: Wallet },
    { id: "NAGAD", label: "Nagad", icon: Wallet },
    { id: "CARD", label: "Card / POS", icon: CreditCard },
    { id: "BANK", label: "Bank Transfer", icon: Building2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white font-bold">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold">Receive Due Payment</h2>
              <p className="text-xs text-emerald-100 truncate max-w-[200px]">{customer.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {successReceipt ? (
          <div className="p-6 space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Payment Collected Successfully!</h3>
              <p className="text-xs text-slate-500 mt-1">Due balance has been updated</p>
            </div>

            {/* Receipt Summary Card */}
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-500">
                <span>Customer</span>
                <span className="font-semibold text-slate-800">{successReceipt.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Amount Paid</span>
                <span className="font-bold text-emerald-700 text-sm">৳{successReceipt.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Payment Mode</span>
                <span className="font-semibold text-slate-800">{successReceipt.paymentMethod}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-500">
                <span>Remaining Due</span>
                <span className={`font-bold ${successReceipt.remainingDue > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  ৳{successReceipt.remainingDue.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Receipt size={14} /> Print Receipt
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCollect} className="p-6 space-y-4">
            {/* Customer Due Balance Highlight */}
            <div className="rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-orange-50 p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-red-600">Current Outstanding Due</p>
                <p className="text-2xl font-black text-red-700 mt-0.5">৳{currDue.toLocaleString()}</p>
              </div>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                Pending
              </span>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Collection Amount (৳) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-8 pr-4 text-base font-bold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setAmount(String(currDue))}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Full Due (৳{currDue.toLocaleString()})
                </button>
                {currDue > 1000 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(Math.round(currDue / 2)))}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    50% (৳{Math.round(currDue / 2).toLocaleString()})
                  </button>
                )}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-bold transition ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={16} className="mb-1" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Reference / Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Received via bKash TrxID: 9X2A8..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-lg transition disabled:opacity-50"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {submitting ? "Processing..." : "Confirm & Save Payment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
