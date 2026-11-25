"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building,
  Lock,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface SslPaymentSuccessData {
  transactionId: string;
  method: string;
  amount: number;
  currency: string;
  orderId?: string;
  accountNumber?: string;
  cardLast4?: string;
  paidAt: string;
}

interface SslPaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (data: SslPaymentSuccessData) => void;
}

type PaymentTab = "CARDS" | "MFS" | "NET_BANKING";

const MFS_GATEWAYS = [
  { id: "bkash", name: "bKash", color: "#E2136E", lightBg: "#FDF0F6", logo: "bKash" },
  { id: "nagad", name: "Nagad", color: "#F7941D", lightBg: "#FEF7EE", logo: "Nagad" },
  { id: "rocket", name: "Rocket", color: "#8C3494", lightBg: "#F9F2FA", logo: "Rocket" },
  { id: "upay", name: "Upay", color: "#0066B3", lightBg: "#EEF6FC", logo: "Upay" },
  { id: "cellfin", name: "CellFin", color: "#007A3D", lightBg: "#EEF8F3", logo: "CellFin" },
];

const BANK_GATEWAYS = [
  { id: "city", name: "City Touch", short: "City Bank" },
  { id: "dbbl", name: "DBBL Nexus", short: "Dutch-Bangla" },
  { id: "ibbl", name: "i-Banking", short: "Islami Bank" },
  { id: "ebl", name: "SKYBANKING", short: "Eastern Bank" },
  { id: "brac", name: "Astha", short: "BRAC Bank" },
  { id: "mtb", name: "MTB Smart", short: "Mutual Trust" },
];

export function SslPaymentModal({
  open,
  onClose,
  amount,
  orderId = `ORD-${Date.now().toString().slice(-6)}`,
  customerName = "Valued Customer",
  customerEmail = "client@example.com",
  customerPhone = "01700000000",
  onSuccess,
}: SslPaymentModalProps) {
  const [activeTab, setActiveTab] = useState<PaymentTab>("CARDS");
  const [selectedMfs, setSelectedMfs] = useState("bkash");
  const [selectedBank, setSelectedBank] = useState("city");

  // Form states
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardHolder, setCardHolder] = useState(customerName);
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("123");

  const [mfsNumber, setMfsNumber] = useState(customerPhone);
  const [mfsPin, setMfsPin] = useState("••••");
  const [mfsStep, setMfsStep] = useState<"NUMBER" | "OTP" | "PIN">("NUMBER");
  const [mfsOtp, setMfsOtp] = useState("123456");

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [trxId, setTrxId] = useState("");

  // Countdown timer (15 mins)
  const [timeLeft, setTimeLeft] = useState(900);

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [open]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePay = () => {
    setProcessing(true);
    const generatedTrxId = `SSL-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    setTrxId(generatedTrxId);

    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);

      setTimeout(() => {
        onSuccess({
          transactionId: generatedTrxId,
          method:
            activeTab === "CARDS"
              ? "VISA/MASTER"
              : activeTab === "MFS"
              ? selectedMfs.toUpperCase()
              : selectedBank.toUpperCase(),
          amount,
          currency: "BDT",
          orderId,
          accountNumber: activeTab === "MFS" ? mfsNumber : undefined,
          cardLast4: activeTab === "CARDS" ? cardNumber.slice(-4) : undefined,
          paidAt: new Date().toISOString(),
        });
        setSuccess(false);
        onClose();
      }, 1200);
    }, 1400);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[620px] overflow-hidden border border-slate-200 flex flex-col my-auto transition-all">
        {/* ── Top SSLCOMMERZ Branded Bar ── */}
        <div className="bg-[#e92929] text-white px-4 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-widest bg-white text-[#e92929] px-2 py-0.5 rounded font-mono">
              SSLCOMMERZ
            </span>
            <span className="text-[11px] font-semibold text-rose-100 flex items-center gap-1 hidden sm:flex">
              <ShieldCheck size={13} /> Secured Payment Gateway
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded text-[11px] font-mono text-white/95">
              <Clock size={12} />
              <span>{formatTimer(timeLeft)}</span>
            </div>
            <button
              onClick={onClose}
              disabled={processing}
              className="text-white/80 hover:text-white p-1 rounded hover:bg-black/10 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Merchant & Order Banner ── */}
        <div className="bg-slate-50 border-b border-slate-200 p-3.5 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-800 text-sm">Blue Oceans POS</p>
            <p className="text-[11px] text-slate-500 font-mono">Order ID: {orderId}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-500">Amount to Pay</p>
            <p className="text-xl font-extrabold text-[#e92929] tabular-nums">
              ৳ {amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* ── Sandbox / Dummy Notice ── */}
        <div className="bg-amber-50 px-3.5 py-1.5 border-b border-amber-200/80 flex items-center justify-between text-[11px] text-amber-900">
          <span className="flex items-center gap-1.5 font-medium">
            <AlertCircle size={13} className="text-amber-600 shrink-0" />
            Sandbox / Test Gateway — Click Pay Now to simulate live payment.
          </span>
          <span className="font-mono text-[10px] bg-amber-200/60 px-1.5 py-0.2 rounded font-bold">
            TEST MODE
          </span>
        </div>

        {/* ── Gateway Payment Tabs ── */}
        <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => setActiveTab("CARDS")}
            className={cn(
              "py-2.5 flex items-center justify-center gap-1.5 transition cursor-pointer border-r border-slate-200",
              activeTab === "CARDS"
                ? "bg-white text-slate-900 border-b-2 border-b-[#e92929] shadow-2xs"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
          >
            <CreditCard size={14} className={activeTab === "CARDS" ? "text-[#e92929]" : ""} />
            <span>Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("MFS")}
            className={cn(
              "py-2.5 flex items-center justify-center gap-1.5 transition cursor-pointer border-r border-slate-200",
              activeTab === "MFS"
                ? "bg-white text-slate-900 border-b-2 border-b-[#e92929] shadow-2xs"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
          >
            <Smartphone size={14} className={activeTab === "MFS" ? "text-[#e92929]" : ""} />
            <span>Mobile Banking</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("NET_BANKING")}
            className={cn(
              "py-2.5 flex items-center justify-center gap-1.5 transition cursor-pointer",
              activeTab === "NET_BANKING"
                ? "bg-white text-slate-900 border-b-2 border-b-[#e92929] shadow-2xs"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
          >
            <Building size={14} className={activeTab === "NET_BANKING" ? "text-[#e92929]" : ""} />
            <span>Net Banking</span>
          </button>
        </div>

        {/* ── Body: Tab Contents ── */}
        <div className="p-4 sm:p-5 flex-1 min-h-[260px] flex flex-col justify-between">
          {success ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 animate-in zoom-in-95">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-1">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-800">Payment Successful!</h3>
              <p className="text-xs text-slate-500">Transaction ID: <span className="font-mono font-bold text-slate-700">{trxId}</span></p>
              <p className="text-xs text-emerald-600 font-semibold">Redirecting to store provisioning...</p>
            </div>
          ) : activeTab === "CARDS" ? (
            /* 1. CARDS TAB */
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-600">Accepted Cards</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">VISA</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">MasterCard</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300">AMEX</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 2222 3333 4444"
                    className="w-full h-10 px-3 pl-9 rounded-lg border border-slate-300 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#e92929]"
                  />
                  <CreditCard size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Expiration Date</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#e92929]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">CVV / CVC</label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#e92929]"
                    />
                    <Lock size={13} className="absolute right-3 top-3 text-slate-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Full Name as on card"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#e92929]"
                />
              </div>
            </div>
          ) : activeTab === "MFS" ? (
            /* 2. MFS TAB */
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                {MFS_GATEWAYS.map((mfs) => (
                  <button
                    key={mfs.id}
                    type="button"
                    onClick={() => {
                      setSelectedMfs(mfs.id);
                      setMfsStep("NUMBER");
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-bold transition cursor-pointer",
                      selectedMfs === mfs.id
                        ? "border-[#e92929] bg-rose-50/50 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-black mb-1 shadow-2xs"
                      style={{ backgroundColor: mfs.color }}
                    >
                      {mfs.name.slice(0, 2)}
                    </span>
                    <span className="text-[11px] truncate">{mfs.name}</span>
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    {MFS_GATEWAYS.find((m) => m.id === selectedMfs)?.name} Wallet Checkout
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck size={13} /> Instant Verification
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    {MFS_GATEWAYS.find((m) => m.id === selectedMfs)?.name} Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={mfsNumber}
                    onChange={(e) => setMfsNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#e92929]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Dummy OTP</label>
                    <input
                      type="text"
                      value={mfsOtp}
                      onChange={(e) => setMfsOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#e92929]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Dummy PIN</label>
                    <input
                      type="password"
                      value={mfsPin}
                      onChange={(e) => setMfsPin(e.target.value)}
                      placeholder="••••"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#e92929]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 3. NET BANKING TAB */
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-600 block">Select Internet Banking Provider</span>
              <div className="grid grid-cols-3 gap-2.5">
                {BANK_GATEWAYS.map((bank) => (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => setSelectedBank(bank.id)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between",
                      selectedBank === bank.id
                        ? "border-[#e92929] bg-rose-50/50 shadow-xs ring-1 ring-[#e92929]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <span className="text-xs font-bold text-slate-800">{bank.name}</span>
                    <span className="text-[10px] text-slate-500 mt-1">{bank.short}</span>
                  </button>
                ))}
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 mt-2">
                <p>
                  You will be routed to the secure Internet Banking authentication portal for{" "}
                  <strong className="text-slate-800">
                    {BANK_GATEWAYS.find((b) => b.id === selectedBank)?.short}
                  </strong>.
                </p>
              </div>
            </div>
          )}

          {/* ── Footer: Pay Now Action ── */}
          {!success && (
            <div className="pt-4 mt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Lock size={12} className="text-slate-400" />
                <span>256-bit SSL Encrypted</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={processing}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={processing}
                  className="px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-[#e92929] hover:bg-[#d42020] transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ৳ {amount.toLocaleString()}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
