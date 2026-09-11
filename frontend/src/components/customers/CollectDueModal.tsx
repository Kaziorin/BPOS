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
      setError("Please enter a valid payment amount greater than 0");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.post<any>(`/v1/customers/${customer.id}/collect-due`, {
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
    { id: "BANK", label: "Bank", icon: Building2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-100">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60">
              <DollarSign size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Collect Due Payment</h2>
              <p className="text-[11px] text-gray-500 truncate max-w-[220px]">{customer.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 transition">
            <X size={16} />
          </button>
        </div>

        {successReceipt ? (
          <div className="p-5 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Payment Recorded</h3>
              <p className="text-xs text-gray-500 mt-0.5">Due balance updated successfully</p>
            </div>

            {/* Receipt Summary */}
            <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3.5 text-left text-xs space-y-2">
              <div className="flex justify-between text-gray-500">
                <span>Customer</span>
                <span className="font-semibold text-gray-800">{successReceipt.customerName}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Amount Paid</span>
                <span className="font-bold text-emerald-700">৳{successReceipt.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Method</span>
                <span className="font-semibold text-gray-800">{successReceipt.paymentMethod}</span>
              </div>
              <div className="border-t border-gray-200 pt-1.5 flex justify-between text-gray-500">
                <span>Remaining Due</span>
                <span className={`font-bold ${successReceipt.remainingDue > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                  ৳{successReceipt.remainingDue.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-gray-300 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Receipt size={13} /> Print
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-primary-600 py-2 text-xs font-semibold text-white hover:bg-primary-700"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCollect} className="p-5 space-y-3.5">
            {/* Current Due Highlight */}
            <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase text-rose-600">Current Due Balance</p>
                <p className="text-xl font-bold text-rose-700 mt-0.5">৳{currDue.toLocaleString()}</p>
              </div>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                Pending
              </span>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 flex items-center gap-1.5">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Payment Amount (৳) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-7 pr-3 text-sm font-bold text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setAmount(String(currDue))}
                  className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Full Due (৳{currDue.toLocaleString()})
                </button>
                {currDue > 1000 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(Math.round(currDue / 2)))}
                    className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    50% (৳{Math.round(currDue / 2).toLocaleString()})
                  </button>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Payment Mode
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {paymentMethods.map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex flex-col items-center justify-center rounded-lg border py-2 px-1 text-[11px] font-medium transition ${
                        isSelected
                          ? "border-primary-600 bg-primary-50 text-primary-700 font-semibold"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={14} className="mb-0.5" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Note / Reference (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. TrxID or Cheque No..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                {submitting ? "Saving..." : "Confirm Collection"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
