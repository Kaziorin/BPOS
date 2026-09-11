"use client";

import { useEffect, useState } from "react";
import { 
  X, Loader2, DollarSign, CheckCircle2, Receipt, AlertCircle, 
  CreditCard, Wallet, Building2, Banknote, Printer, ArrowRight 
} from "lucide-react";
import { api } from "@/lib/api";

interface PaySupplierDueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplier: any | null;
}

export function PaySupplierDueModal({ isOpen, onClose, onSuccess, supplier }: PaySupplierDueModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [referenceNo, setReferenceNo] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  useEffect(() => {
    if (supplier && isOpen) {
      setAmount(supplier.currentDue ? String(supplier.currentDue) : "");
      setPaymentMethod("CASH");
      setReferenceNo("");
      setNote("");
      setError(null);
      setSuccessReceipt(null);
    }
  }, [supplier, isOpen]);

  if (!isOpen || !supplier) return null;

  const currDue = Number(supplier.currentDue || 0);

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid payment amount greater than 0");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post<any>(`/v1/suppliers/${supplier.id}/pay-due`, {
        amount: numAmount,
        paymentMethod,
        referenceNo: referenceNo.trim() || undefined,
        note: note.trim() || undefined,
      });

      setSuccessReceipt({
        amount: numAmount,
        previousDue: currDue,
        remainingDue: Math.max(0, currDue - numAmount),
        paymentMethod,
        referenceNo: referenceNo.trim(),
        supplierName: supplier.name,
        company: supplier.company,
        date: new Date().toLocaleString(),
      });
      onSuccess();
    } catch (err: any) {
      console.error("Pay supplier due error:", err);
      setError(err.response?.data?.error || err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  }

  const paymentMethods = [
    { id: "CASH", label: "Cash", icon: Banknote },
    { id: "BANK", label: "Bank Transfer", icon: Building2 },
    { id: "CHEQUE", label: "Cheque", icon: Receipt },
    { id: "BKASH", label: "bKash", icon: Wallet },
    { id: "NAGAD", label: "Nagad", icon: Wallet },
    { id: "CARD", label: "Corporate Card", icon: CreditCard },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-100">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 font-bold border border-rose-200/60">
              <DollarSign size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Pay Supplier Due</h2>
              <p className="text-[11px] text-gray-500 truncate max-w-[220px]">
                {supplier.name} {supplier.company ? `(${supplier.company})` : ""}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 transition"
          >
            <X size={16} />
          </button>
        </div>

        {successReceipt ? (
          /* Receipt Success State */
          <div className="p-5 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 size={26} />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">Payment Recorded Successfully</h3>
              <p className="text-xs text-gray-500 mt-0.5">Accounts payable due updated in real-time.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between text-gray-500">
                <span>Vendor</span>
                <span className="font-semibold text-gray-800">{successReceipt.supplierName}</span>
              </div>
              {successReceipt.company && (
                <div className="flex justify-between text-gray-500">
                  <span>Company</span>
                  <span className="font-semibold text-gray-800">{successReceipt.company}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Payment Method</span>
                <span className="font-semibold text-gray-800 uppercase">{successReceipt.paymentMethod}</span>
              </div>
              {successReceipt.referenceNo && (
                <div className="flex justify-between text-gray-500">
                  <span>Reference / Cheque</span>
                  <span className="font-semibold text-gray-800">{successReceipt.referenceNo}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Date & Time</span>
                <span className="font-semibold text-gray-800">{successReceipt.date}</span>
              </div>

              <div className="border-t border-gray-200 pt-2 space-y-1">
                <div className="flex justify-between text-gray-500">
                  <span>Previous Due</span>
                  <span className="font-semibold text-gray-700">৳{Number(successReceipt.previousDue).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Amount Paid</span>
                  <span>- ৳{Number(successReceipt.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-bold pt-1 border-t border-gray-200">
                  <span>Remaining Due</span>
                  <span className={successReceipt.remainingDue > 0 ? "text-rose-600" : "text-emerald-600"}>
                    ৳{Number(successReceipt.remainingDue).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                <Printer size={14} /> Print Receipt
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-primary-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handlePayment} className="p-5 space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Current Due Highlight */}
            <div className="rounded-xl border border-rose-200/70 bg-rose-50/50 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Current Payable Due</span>
                <p className="text-xl font-bold text-rose-600">৳{currDue.toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => setAmount(String(currDue))}
                className="rounded-lg bg-white border border-rose-300 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition shadow-2xs"
              >
                Full Due
              </button>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Payment Amount (৳) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">৳</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  autoFocus
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-7 pr-3 text-sm font-bold text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
                />
              </div>
              {Number(amount) > 0 && currDue > 0 && (
                <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                  Remaining balance after payment:{" "}
                  <span className="font-bold text-gray-800">
                    ৳{Math.max(0, currDue - Number(amount)).toLocaleString()}
                  </span>
                </p>
              )}
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      type="button"
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition ${
                        isSelected
                          ? "border-primary-600 bg-primary-50/70 text-primary-700 ring-1 ring-primary-500"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={16} className={isSelected ? "text-primary-600" : "text-gray-400"} />
                      <span className="mt-1 text-[11px]">{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Reference / Cheque / Txn ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. CQ-90210, TXN-87261"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Note / Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Cleared for Invoice #INV-1049"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !amount || Number(amount) <= 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition"
              >
                {submitting && <Loader2 size={13} className="animate-spin" />}
                Confirm Payment
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
