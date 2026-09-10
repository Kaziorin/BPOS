"use client";

import React, { useState } from "react";
import {
  Bell,
  ChevronDown,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  Wallet,
  ArrowRight,
  User,
  Pill,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface RxCartItem {
  productId: string;
  variantId?: string | null;
  name: string;
  qty: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  batchNo?: string | null;
  expiryDate?: string | null;
  imageUrl?: string | null;
  unitLabel?: string;
  stockQty?: number;
  drugInteraction?: string | null;
}

export type PayMethod = "CASH" | "CARD" | "MOBILE" | "BANK" | "CREDIT";

export const PAY_METHODS: { id: PayMethod; label: string; Icon: React.ElementType }[] = [
  { id: "CASH", label: "Cash", Icon: Wallet },
  { id: "CARD", label: "Card", Icon: Wallet },
  { id: "MOBILE", label: "Mobile", Icon: Wallet },
  { id: "BANK", label: "Bank", Icon: Wallet },
  { id: "CREDIT", label: "Credit", Icon: Wallet },
];

interface PharmacyPOSRightPanelProps {
  rxMode: boolean;
  setRxMode: React.Dispatch<React.SetStateAction<boolean>>;
  cart: RxCartItem[];
  itemCount: number;
  subtotal: number;
  totalDiscount: number;
  vatAmount: number;
  total: number;
  customers: { id: string; name: string }[];
  customerId: string;
  setCustomerId: (id: string) => void;
  discountInput: string;
  setDiscountInput: (val: string) => void;
  applyDiscount: () => void;
  note: string;
  setNote: (val: string) => void;
  payMethod: PayMethod;
  setPayMethod: (m: PayMethod) => void;
  onQty: (idx: number, qty: number) => void;
  onRemove: (idx: number) => void;
  onClearCart: () => void;
  holdBill: () => void;
  confirmSale: () => void;
  submitting?: boolean;
  error?: string | null;
}

export function PharmacyPOSRightPanel({
  rxMode,
  setRxMode,
  cart,
  itemCount,
  subtotal,
  totalDiscount,
  vatAmount,
  total,
  customers,
  customerId,
  setCustomerId,
  discountInput,
  setDiscountInput,
  applyDiscount,
  note,
  setNote,
  payMethod,
  setPayMethod,
  onQty,
  onRemove,
  onClearCart,
  holdBill,
  confirmSale,
  submitting,
  error,
}: PharmacyPOSRightPanelProps) {
  const [safetyOpen, setSafetyOpen] = useState(true);

  return (
    <aside className="flex w-full flex-col overflow-hidden bg-white h-full">
      {/* ═══ TOP HEADER ═══ */}
      <div className="flex flex-none items-center justify-between border-b border-slate-200 px-3 py-2.5 bg-white">
        {/* Rx Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-2.5 py-1">
            <span className="text-[11px] font-black text-slate-700">Rx Mode</span>
            <button
              type="button"
              role="switch"
              aria-checked={rxMode}
              onClick={() => setRxMode((v) => !v)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none",
                rxMode ? "bg-[#00796b]" : "bg-slate-300",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5",
                  rxMode ? "translate-x-4" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        </div>

        {/* Right Bell & Profile */}
        <div className="flex items-center gap-2">
          {/* Bell Icon with notification counter badge */}
          <button type="button" className="relative rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 transition">
            <Bell size={17} />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              3
            </span>
          </button>

          {/* Profile Dropdown Pill */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1 shadow-2xs">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white font-bold text-[11px]">
              <User size={14} />
            </div>
            <div className="leading-tight text-left">
              <p className="text-[11px] font-extrabold text-slate-800">Pharmacist</p>
              <p className="text-[9px] font-semibold text-slate-400">shop-01</p>
            </div>
            <ChevronDown size={13} className="text-slate-400 ml-0.5" />
          </div>
        </div>
      </div>

      {/* ═══ CART HEADER ═══ */}
      <div className="flex flex-none items-center justify-between border-b border-slate-100 px-3 py-2.5 bg-white">
        <div className="flex items-center gap-2">
          <ShoppingBag size={17} className="text-[#00796b]" />
          <h2 className="text-[13.5px] font-black text-slate-800">
            Cart <span className="text-slate-500 font-bold">({itemCount} Items)</span>
          </h2>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="rounded-lg p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition"
              title="Clear cart"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Customer Select Dropdown */}
        <div className="flex items-center gap-1">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-2 py-1">
            <User size={13} className="text-slate-400 mr-1.5" />
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">Customer: Walk-in</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition"
            title="Add customer"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* ═══ CART BODY (Scrollable Cart Items List Only) ═══ */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <ShoppingBag size={28} className="text-slate-200 mb-1.5" />
            <p className="text-xs font-semibold">Cart is empty</p>
          </div>
        ) : (
          cart.map((item, idx) => (
            <div
              key={`${item.productId}-${idx}`}
              className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-2 shadow-2xs"
            >
              {/* Thumb */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-100 overflow-hidden">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <Pill size={16} className="text-slate-400" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-[12px] font-extrabold text-slate-800 leading-tight">{item.name}</h4>
                <p className="text-[10px] font-semibold text-slate-400 leading-none mt-0.5">
                  Stock: {item.stockQty ?? 60}
                </p>
                {item.drugInteraction && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 mt-0.5 leading-none">
                    <CheckCircle2 size={10} />
                    <span>{item.drugInteraction}</span>
                  </div>
                )}
              </div>

              {/* Qty controls */}
              <div className="flex items-center gap-0.5 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => onQty(idx, item.qty - 1)}
                  className="flex h-4.5 w-4.5 items-center justify-center rounded bg-white text-slate-600 hover:bg-slate-100 transition shadow-2xs"
                >
                  <Minus size={9} />
                </button>
                <span className="w-4 text-center text-[10.5px] font-extrabold text-slate-800">{item.qty}</span>
                <button
                  type="button"
                  onClick={() => onQty(idx, item.qty + 1)}
                  className="flex h-4.5 w-4.5 items-center justify-center rounded bg-white text-slate-600 hover:bg-slate-100 transition shadow-2xs"
                >
                  <Plus size={9} />
                </button>
              </div>

              {/* Item total price */}
              <div className="w-14 text-right font-black text-[12px] text-slate-800 tabular-nums">
                ৳ {item.lineTotal.toFixed(2)}
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="text-rose-400 hover:text-rose-600 transition p-0.5"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* ═══ FIXED BOTTOM CHECKOUT & TOTALS (Always Visible) ═══ */}
      <div className="flex-none border-t border-slate-200 bg-white px-3 py-2 space-y-2">
        {/* Pharmacy Safety Check Accordion */}
        <div className="rounded-xl border border-teal-200/80 bg-[#e8f7f5] overflow-hidden">
          <button
            type="button"
            onClick={() => setSafetyOpen((v) => !v)}
            className="flex w-full items-center justify-between px-2.5 py-1.5 text-left"
          >
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold text-[#00796b]">
              <ShieldCheck size={14} /> Pharmacy Safety Check
            </span>
            <ChevronDown size={13} className={cn("text-[#00796b] transition", safetyOpen && "rotate-180")} />
          </button>
          {safetyOpen && (
            <div className="space-y-1 border-t border-teal-200/50 px-2.5 py-1.5 bg-white/40">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-600">
                <CheckCircle2 size={12} /> Prescription verified
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-600">
                <CheckCircle2 size={12} /> No drug interaction detected
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-amber-600">
                <AlertTriangle size={12} /> 1 Item expires soon (Metformin)
              </div>
            </div>
          )}
        </div>

        {/* Discount & Sales Note */}
        <div className="grid grid-cols-2 gap-2">
          {/* Apply Discount */}
          <div>
            <label className="block mb-0.5 text-[9.5px] font-bold text-slate-500">Apply Discount</label>
            <div className="flex items-center gap-1">
              <div className="relative flex-1">
                <span className="absolute left-2 top-1.5 text-[10px] font-bold text-slate-400">%</span>
                <input
                  type="number"
                  min="0"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder=""
                  className="w-full rounded-lg border border-slate-200 bg-white pl-5 pr-1.5 py-1 text-[11px] font-bold text-slate-800 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={applyDiscount}
                className="rounded-lg bg-[#00796b] px-2.5 py-1 text-[10.5px] font-bold text-white hover:bg-[#005a50] transition shrink-0 shadow-2xs"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Sales Note */}
          <div>
            <label className="block mb-0.5 text-[9.5px] font-bold text-slate-500">Sales Note</label>
            <textarea
              rows={1}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add note..."
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10.5px] font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Calculation Totals */}
        <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-[11.5px]">
          <div className="flex justify-between text-slate-600 font-semibold">
            <span>Sub Total</span>
            <span className="font-extrabold tabular-nums text-slate-800">৳ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600 font-semibold">
            <span>Discount</span>
            <span className="font-extrabold tabular-nums text-emerald-600">− ৳ {totalDiscount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600 font-semibold">
            <span>VAT (5%)</span>
            <span className="font-extrabold tabular-nums text-slate-800">৳ {vatAmount.toFixed(2)}</span>
          </div>
          <div className="pt-1.5 border-t border-slate-200 border-dashed flex items-baseline justify-between">
            <span className="text-[13px] font-black text-slate-900">Total</span>
            <span className="text-[20px] font-black tabular-nums text-[#00796b]">
              ৳ {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-5 gap-1">
          {PAY_METHODS.map(({ id, label }) => {
            const active = payMethod === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPayMethod(id)}
                className={cn(
                  "rounded-lg border py-1.5 text-center text-[9.5px] font-bold transition",
                  active
                    ? "border-[#00796b] bg-[#e6f7f5] text-[#00796b]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 border border-rose-100 p-1.5 text-[10.5px] font-bold text-rose-600">
            {error}
          </p>
        )}

        {/* Bottom Hold & Pay Buttons */}
        <div className="flex gap-2">
          {/* Hold Bill */}
          <button
            type="button"
            onClick={holdBill}
            disabled={cart.length === 0}
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 transition disabled:opacity-40"
          >
            <PauseCircle size={16} />
            <span className="text-[9.5px] font-extrabold mt-0.5">Hold Bill</span>
            <span className="text-[7.5px] font-semibold text-slate-400">(F6)</span>
          </button>

          {/* Pay Button */}
          <button
            type="button"
            disabled={cart.length === 0 || submitting}
            onClick={confirmSale}
            className="flex-1 flex items-center justify-between rounded-xl bg-[#00796b] px-3.5 py-2.5 text-white shadow-md hover:bg-[#005a50] transition disabled:opacity-50"
          >
            <div className="flex items-center gap-1.5">
              <Wallet size={16} />
              <span className="text-[14px] font-black">Pay</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-black tabular-nums">৳ {total.toFixed(2)}</span>
              <span className="text-[10px] font-bold opacity-80">(F1) →</span>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}
