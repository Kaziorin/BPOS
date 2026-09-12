"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, CheckCircle2, Printer, CreditCard, Banknote, Smartphone, Landmark, Wallet, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

export type WsCheckoutPayMethod = "CASH" | "CARD" | "MOBILE" | "BANK" | "CREDIT";

interface WsCheckoutPayMethodDef {
  id: WsCheckoutPayMethod;
  label: string;
  icon: React.ReactNode;
  desc: string;
}

const CHECKOUT_METHODS: WsCheckoutPayMethodDef[] = [
  {
    id: "CREDIT",
    label: "Credit",
    desc: "B2B Store Credit",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: "CASH",
    label: "Cash",
    desc: "Physical Currency",
    icon: <Banknote className="w-5 h-5" />,
  },
  {
    id: "MOBILE",
    label: "Mobile",
    desc: "bKash / Nagad",
    icon: <Smartphone className="w-5 h-5" />,
  },
  {
    id: "BANK",
    label: "Bank",
    desc: "Bank Transfer",
    icon: <Landmark className="w-5 h-5" />,
  },
  {
    id: "CARD",
    label: "Card",
    desc: "POS Terminal",
    icon: <Wallet className="w-5 h-5" />,
  },
];

const CASH_DENOMINATIONS = [10, 20, 50, 100, 200, 500, 1000, 2000];

export interface WholesaleCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shipping: number;
  itemCount: number;
  customerName?: string;
  salesRepName?: string;
  payMethod: WsCheckoutPayMethod;
  onChangePayMethod: (m: WsCheckoutPayMethod) => void;
  onConfirm: (tenderedAmount?: number, printReceipt?: boolean) => void;
  submitting?: boolean;
  darkMode?: boolean;
}

export function WholesaleCheckoutModal({
  open,
  onClose,
  total,
  subtotal,
  taxAmount,
  discountAmount,
  shipping,
  itemCount,
  customerName = "Walk-in Customer",
  salesRepName = "Staff",
  payMethod,
  onChangePayMethod,
  onConfirm,
  submitting,
  darkMode,
}: WholesaleCheckoutModalProps) {
  const [cashInput, setCashInput] = useState<string>("");
  const [tenderedInput, setTenderedInput] = useState<string>("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const refInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCashInput("");
      setTenderedInput(total.toFixed(2));
      setTimeout(() => refInput.current?.focus(), 120);
    }
  }, [open, total]);

  const cashTendered = parseFloat(cashInput) || 0;
  const cashChange = Math.max(cashTendered - total, 0);

  const amountPaid = payMethod === "CASH" ? Math.min(cashTendered, total) : (parseFloat(tenderedInput) || 0);
  const remainingDue = Math.max(total - amountPaid, 0);

  const isExact = cashTendered > 0 && Math.abs(cashTendered - total) < 0.01;
  const canPay = payMethod !== "CASH" ? (parseFloat(tenderedInput) >= 0) : cashTendered > 0;

  function addDenom(d: number) {
    setCashInput((prev) => {
      const cur = parseFloat(prev) || 0;
      return (cur + d).toString();
    });
  }

  function setExact() {
    setCashInput(total.toFixed(2));
    setTenderedInput(total.toFixed(2));
  }

  function handleConfirm() {
    const finalAmount = payMethod === "CASH" ? cashTendered : amountPaid;
    onConfirm(finalAmount, printReceipt);
  }

  if (!open) return null;

  const textPrimary = darkMode ? "text-slate-100" : "text-slate-900";
  const textSub = darkMode ? "text-slate-400" : "text-slate-500";
  const cardBg = darkMode ? "bg-slate-800/60 border-slate-700" : "bg-slate-50/50 border-slate-200";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className={cn(
          "relative w-full max-w-[480px] rounded-[32px] shadow-2xl overflow-hidden border animate-in zoom-in-95 fade-in duration-200",
          darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"
        )}
      >
        {/* HEADER */}
        <div className={cn(
          "flex items-center justify-between px-6 py-5 border-b",
          darkMode ? "border-slate-800 bg-slate-900" : "border-slate-50 bg-gradient-to-r from-blue-50/50 to-white"
        )}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <CreditCard size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className={cn("text-[18px] font-black tracking-tight", textPrimary)}>Checkout & Settlement</h2>
              <p className={cn("text-[11px] font-bold uppercase tracking-wider", textSub)}>
                {itemCount} Items · {customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "rounded-xl p-2 transition-all active:scale-95",
              darkMode ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <X size={20} />
          </button>
        </div>

        {/* TOTAL DUE STRIP */}
        <div className={cn(
          "flex items-center justify-between gap-4 px-6 py-5 border-b",
          darkMode ? "border-slate-800 bg-slate-800/40" : "border-slate-50 bg-blue-50/30"
        )}>
          <div>
            <p className={cn("text-[10px] font-black uppercase tracking-[0.15em] mb-1", textSub)}>Grand Total Due</p>
            <p className="text-[36px] font-black tabular-nums text-blue-600 leading-none tracking-tighter">
              ৳{total.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className={cn("text-[11px] font-bold space-y-1 text-right shrink-0", textSub)}>
            <div className="flex justify-between gap-8">
              <span>Subtotal</span>
              <span className={textPrimary}>৳{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between gap-8">
                <span>Discount</span>
                <span className="text-emerald-500">−৳{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between gap-8">
              <span>Tax & Shipping</span>
              <span className={textPrimary}>৳{(taxAmount + shipping).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="px-6 py-5 space-y-5 max-h-[55vh] overflow-y-auto custom-scrollbar">
          {/* PAYMENT METHODS */}
          <div>
            <p className={cn("text-[10px] font-black uppercase tracking-[0.15em] mb-3", textSub)}>Select Payment Method</p>
            <div className="grid grid-cols-5 gap-2">
              {CHECKOUT_METHODS.map(({ id, label, icon, desc }) => {
                const active = payMethod === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChangePayMethod(id)}
                    title={desc}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-2xl border py-4 text-center transition-all duration-200",
                      active
                        ? "border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-[1.05]"
                        : darkMode
                          ? "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                          : "border-slate-100 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-600"
                    )}
                  >
                    {icon}
                    <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CASH TENDERING */}
          {payMethod === "CASH" ? (
            <div className={cn("rounded-[24px] border p-5 space-y-4 transition-all duration-300", cardBg)}>
              <div className="flex items-center justify-between">
                <p className={cn("text-[10px] font-black uppercase tracking-widest", textSub)}>Cash Amount Tendered</p>
                <button
                  type="button"
                  onClick={setExact}
                  className="text-[11px] font-black text-blue-600 hover:underline underline-offset-4"
                >
                  SET EXACT AMOUNT
                </button>
              </div>

              <div className="relative">
                <span className={cn("absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-black", darkMode ? "text-slate-500" : "text-slate-300")}>৳</span>
                <input
                  ref={refInput}
                  type="number"
                  min="0"
                  step="1"
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
                  placeholder="0.00"
                  className={cn(
                    "w-full rounded-2xl border pl-10 pr-5 py-4 text-[28px] font-black text-right tabular-nums focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all",
                    darkMode ? "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-800" : "bg-white border-slate-200 text-slate-900 placeholder-slate-100",
                    isExact ? "border-emerald-400 focus:ring-emerald-600/10" : ""
                  )}
                />
                {isExact && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-sm animate-in zoom-in-50">
                    MATCHED
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {CASH_DENOMINATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => addDenom(d)}
                    className={cn(
                      "rounded-xl border py-3 text-[12px] font-black transition-all active:scale-95 shadow-sm",
                      darkMode
                        ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                        : "border-slate-100 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                    )}
                  >
                    +৳{d >= 1000 ? `${d / 1000}k` : d}
                  </button>
                ))}
              </div>

              <div className={cn(
                "flex items-center justify-between rounded-2xl border px-5 py-4 transition-all duration-300",
                cashChange > 0
                  ? "border-emerald-200 bg-emerald-50/50 shadow-inner"
                  : remainingDue > 0
                    ? "border-rose-200 bg-rose-50/50 shadow-inner"
                    : darkMode
                      ? "border-slate-700 bg-slate-900/40"
                      : "border-slate-100 bg-white shadow-sm"
              )}>
                <span className={cn(
                  "text-[13px] font-bold uppercase tracking-wider",
                  cashChange > 0 ? "text-emerald-700" : remainingDue > 0 ? "text-rose-700" : textSub
                )}>
                  {cashChange > 0 ? "Change Return" : remainingDue > 0 ? "Remaining Due" : "Payment Status"}
                </span>
                <span className={cn(
                  "text-[22px] font-black tabular-nums tracking-tighter",
                  cashChange > 0 ? "text-emerald-600" : remainingDue > 0 ? "text-rose-600" : darkMode ? "text-slate-600" : "text-slate-200"
                )}>
                  ৳{cashChange > 0 ? cashChange.toFixed(2) : remainingDue.toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <div className={cn("rounded-[24px] border p-5 space-y-4 transition-all duration-300", cardBg)}>
              <div className="flex items-center justify-between">
                <p className={cn("text-[10px] font-black uppercase tracking-widest", textSub)}>Partial Payment / Amount Paid</p>
                <button
                  type="button"
                  onClick={() => setTenderedInput(total.toFixed(2))}
                  className="text-[11px] font-black text-blue-600 hover:underline underline-offset-4"
                >
                  PAY FULL AMOUNT
                </button>
              </div>

              <div className="relative">
                <span className={cn("absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-black", darkMode ? "text-slate-500" : "text-slate-300")}>৳</span>
                <input
                  type="number"
                  min="0"
                  max={total}
                  step="0.01"
                  value={tenderedInput}
                  onChange={(e) => setTenderedInput(e.target.value)}
                  placeholder="0.00"
                  className={cn(
                    "w-full rounded-2xl border pl-10 pr-5 py-4 text-[28px] font-black text-right tabular-nums focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all",
                    darkMode ? "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-800" : "bg-white border-slate-200 text-slate-900 placeholder-slate-100",
                  )}
                />
              </div>

              <div className={cn(
                "flex items-center justify-between rounded-2xl border px-5 py-4 transition-all duration-300",
                remainingDue > 0
                  ? "border-rose-200 bg-rose-50/50 shadow-inner"
                  : darkMode
                    ? "border-slate-700 bg-slate-900/40"
                    : "border-slate-100 bg-white shadow-sm"
              )}>
                <span className={cn(
                  "text-[13px] font-bold uppercase tracking-wider",
                  remainingDue > 0 ? "text-rose-700" : textSub
                )}>
                  Remaining Due
                </span>
                <span className={cn(
                  "text-[22px] font-black tabular-nums tracking-tighter",
                  remainingDue > 0 ? "text-rose-600" : darkMode ? "text-slate-600" : "text-slate-200"
                )}>
                  ৳{remainingDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* NON-CASH NOTICE */}
          {payMethod !== "CASH" && (
            <div className={cn(
              "flex items-center gap-4 rounded-[24px] border px-5 py-4 shadow-sm",
              darkMode ? "border-blue-900/30 bg-blue-950/20" : "border-blue-100 bg-blue-50/30"
            )}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <CheckCircle2 size={20} strokeWidth={2.5} />
              </div>
              <div>
                <p className={cn("text-[14px] font-black tracking-tight", darkMode ? "text-blue-300" : "text-blue-700")}>
                  {CHECKOUT_METHODS.find(m => m.id === payMethod)?.label} Selected
                </p>
                <p className={cn("text-[11px] font-bold opacity-80 mt-0.5", darkMode ? "text-blue-400" : "text-blue-600")}>
                  Settlement via {CHECKOUT_METHODS.find(m => m.id === payMethod)?.desc}
                </p>
              </div>
            </div>
          )}

          {/* PRINT TOGGLE */}
          <div className={cn(
            "flex items-center justify-between rounded-2xl border px-5 py-4 transition-all hover:shadow-sm",
            darkMode ? "border-slate-700 bg-slate-800/30" : "border-slate-100 bg-white"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-50 text-slate-600"
              )}>
                <Printer size={18} />
              </div>
              <div>
                <p className={cn("text-[13px] font-bold", textPrimary)}>Thermal Receipt</p>
                <p className={cn("text-[10px] font-bold text-slate-400 uppercase tracking-widest")}>Mushak-6.3 Format</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={printReceipt}
              onClick={() => setPrintReceipt((v) => !v)}
              className={cn(
                "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none p-1",
                printReceipt ? "bg-blue-600 shadow-inner" : darkMode ? "bg-slate-700" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                  printReceipt ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className={cn(
          "flex items-center gap-3 px-6 py-5 border-t",
          darkMode ? "border-slate-800 bg-slate-900" : "border-slate-50 bg-white"
        )}>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "rounded-2xl border px-6 py-3.5 text-[14px] font-black transition-all active:scale-95",
              darkMode
                ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            CANCEL
          </button>

          <button
            type="button"
            disabled={!canPay || !!submitting}
            onClick={handleConfirm}
            className={cn(
              "flex-1 flex items-center justify-between rounded-2xl px-6 py-3.5 text-white shadow-2xl transition-all active:scale-[0.98]",
              canPay
                ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
                : "bg-slate-200 text-slate-400 cursor-not-allowed",
              "disabled:opacity-50"
            )}
          >
            <div className="flex items-center gap-3">
              {submitting ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={20} strokeWidth={3} />}
              <span className="text-[15px] font-black uppercase tracking-wide">
                {submitting ? "Processing..." : "Complete Order"}
              </span>
            </div>
            <span className="text-[20px] font-black tabular-nums">৳{total.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
