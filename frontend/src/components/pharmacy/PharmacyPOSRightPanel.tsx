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
  CreditCard,
  Smartphone,
  Landmark,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { NotificationDropdown, ProfileDropdown, type NotificationItem } from "./PharmacyPOSModals";

function CashRegisterIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="5" rx="1" />
      <path d="M4 13h16" />
      <path d="M5 9h14l1 9H4l1-9z" />
      <path d="M8 12h.01M12 12h.01M16 12h.01M8 15h.01M12 15h.01M16 15h.01" strokeWidth="2.5" />
    </svg>
  );
}

export interface RxCartItem {
  productId: string;
  variantId?: string | null;
  name: string;
  sku?: string;
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
  { id: "CARD", label: "Card", Icon: CreditCard },
  { id: "MOBILE", label: "Mobile", Icon: Smartphone },
  { id: "BANK", label: "Bank", Icon: Landmark },
  { id: "CREDIT", label: "Credit", Icon: Receipt },
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
  discountApplied?: boolean;
  note: string;
  setNote: (val: string) => void;
  payMethod: PayMethod;
  setPayMethod: (m: PayMethod) => void;
  onQty: (idx: number, qty: number) => void;
  onRemove: (idx: number) => void;
  onClearCart: () => void;
  holdBill: () => void;
  onOpenCheckout: () => void;
  submitting?: boolean;
  error?: string | null;
  cashierName?: string;
  terminalName?: string;
  onAddCustomer?: () => void;
  notifications?: NotificationItem[];
  onMarkAllReadNotifications?: () => void;
  onClearAllNotifications?: () => void;
  onDismissNotification?: (id: string | number) => void;
  onOpenHardwareSettings?: () => void;
  darkMode?: boolean;
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
  discountApplied = false,
  note,
  setNote,
  payMethod,
  setPayMethod,
  onQty,
  onRemove,
  onClearCart,
  holdBill,
  onOpenCheckout,
  submitting,
  error,
  cashierName = "Pharmacist",
  terminalName = "PC-01",
  onAddCustomer,
  notifications = [],
  onMarkAllReadNotifications,
  onClearAllNotifications,
  onDismissNotification,
  onOpenHardwareSettings,
  darkMode,
}: PharmacyPOSRightPanelProps) {
  const [safetyOpen, setSafetyOpen] = useState(true);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <aside className={cn(
      "flex w-full flex-col overflow-hidden border-l h-full transition",
      darkMode ? "border-slate-800 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-800"
    )}>
      {/* ═══ TOP HEADER ═══ */}
      <div className={cn("flex flex-none items-center justify-between border-b px-3 py-2.5 transition", darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")}>
        {/* Rx Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className={cn("flex items-center gap-2 rounded-xl border px-2.5 py-1", darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200")}>
            <span className={cn("text-[11px] font-black", darkMode ? "text-slate-200" : "text-slate-700")}>Rx Mode</span>
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
          {/* Bell Icon */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setBellOpen((v) => !v); setProfileOpen(false); }}
              className={cn("relative rounded-xl p-1.5 text-slate-400 transition", darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100")}
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>
            <NotificationDropdown
              open={bellOpen}
              onClose={() => setBellOpen(false)}
              notifications={notifications}
              onMarkAllRead={onMarkAllReadNotifications}
              onClearAll={onClearAllNotifications}
              onDismiss={onDismissNotification}
            />
          </div>

          {/* Profile Dropdown Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setProfileOpen((v) => !v); setBellOpen(false); }}
              className={cn("flex items-center gap-2 rounded-xl border px-2 py-1 shadow-2xs transition", darkMode ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800")}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white font-bold text-[11px]">
                <User size={14} />
              </div>
              <div className="leading-tight text-left">
                <p className="text-[11px] font-extrabold">{cashierName}</p>
                <p className="text-[9px] font-semibold text-slate-400">{terminalName}</p>
              </div>
              <ChevronDown size={13} className="text-slate-400 ml-0.5" />
            </button>
            <ProfileDropdown
              open={profileOpen}
              onClose={() => setProfileOpen(false)}
              cashierName={cashierName}
              terminalName={terminalName}
              onOpenSettings={onOpenHardwareSettings}
            />
          </div>
        </div>
      </div>

      {/* ═══ CART HEADER ═══ */}
      <div className={cn("flex flex-none items-center justify-between border-b px-3 py-2.5 transition", darkMode ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white")}>
        <div className="flex items-center gap-2">
          <ShoppingBag size={17} className="text-[#00796b]" />
          <h2 className={cn("text-[13.5px] font-black", darkMode ? "text-slate-100" : "text-slate-800")}>
            Cart <span className="text-slate-400 font-bold">({itemCount} Items)</span>
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
          <div className={cn("flex items-center rounded-xl border px-2 py-1", darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50")}>
            <User size={13} className="text-slate-400 mr-1.5" />
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className={cn("bg-transparent text-[11px] font-bold focus:outline-none cursor-pointer max-w-[100px]", darkMode ? "text-slate-200" : "text-slate-700")}
            >
              <option value="" className={darkMode ? "bg-slate-800 text-slate-100" : ""}>Walk-in</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id} className={darkMode ? "bg-slate-800 text-slate-100" : ""}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={onAddCustomer}
            className={cn("flex h-7 w-7 items-center justify-center rounded-xl border transition", darkMode ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-[#00796b] hover:border-teal-200")}
            title="Add new customer"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* ═══ CART BODY ═══ */}
      <div className={cn("min-h-0 flex-1 overflow-y-auto px-3 py-2 space-y-1.5 transition", darkMode ? "bg-slate-950" : "bg-white")}>
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <ShoppingBag size={28} className="text-slate-300 mb-1.5" />
            <p className="text-xs font-semibold">Cart is empty</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Search and click a product to add</p>
          </div>
        ) : (
          cart.map((item, idx) => (
            <div
              key={`${item.productId}-${idx}`}
              className={cn("flex items-center gap-2 rounded-xl border p-2 shadow-2xs transition", darkMode ? "border-slate-800 bg-slate-900 text-slate-100 hover:border-slate-700" : "border-slate-200/80 bg-white hover:border-teal-200")}
            >
              {/* Thumb */}
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border overflow-hidden", darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-100")}>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <Pill size={16} className="text-slate-400" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h4 className={cn("truncate text-[12px] font-extrabold leading-tight", darkMode ? "text-slate-100" : "text-slate-800")}>{item.name}</h4>
                <p className="text-[10px] font-semibold text-slate-400 leading-none mt-0.5">
                  ৳{item.unitPrice.toFixed(2)} · Stock: {item.stockQty ?? "—"}
                </p>
                {item.drugInteraction && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 mt-0.5 leading-none">
                    <CheckCircle2 size={10} />
                    <span>{item.drugInteraction}</span>
                  </div>
                )}
              </div>

              {/* Qty controls */}
              <div className={cn("flex items-center gap-0.5 border rounded-lg p-0.5", darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200")}>
                <button
                  type="button"
                  onClick={() => onQty(idx, item.qty - 1)}
                  className={cn("flex h-5 w-5 items-center justify-center rounded transition shadow-2xs", darkMode ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-white text-slate-600 hover:bg-slate-100")}
                >
                  <Minus size={9} />
                </button>
                <span className={cn("w-5 text-center text-[10.5px] font-extrabold", darkMode ? "text-slate-100" : "text-slate-800")}>{item.qty}</span>
                <button
                  type="button"
                  onClick={() => onQty(idx, item.qty + 1)}
                  className={cn("flex h-5 w-5 items-center justify-center rounded transition shadow-2xs", darkMode ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-white text-slate-600 hover:bg-slate-100")}
                >
                  <Plus size={9} />
                </button>
              </div>

              {/* Item total price */}
              <div className={cn("text-right font-black text-[12px] tabular-nums whitespace-nowrap shrink-0", darkMode ? "text-slate-100" : "text-slate-800")}>
                ৳ {item.lineTotal.toFixed(2)}
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="text-rose-400 hover:text-rose-600 transition p-0.5 rounded hover:bg-rose-50"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* ═══ FIXED BOTTOM CHECKOUT & TOTALS ═══ */}
      <div className={cn("flex-none border-t px-3 py-2 space-y-2 transition", darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")}>
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
              {cart.some((i) => i.expiryDate) && (
                <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-amber-600">
                  <AlertTriangle size={12} /> Check expiry dates on items
                </div>
              )}
            </div>
          )}
        </div>

        {/* Discount & Sales Note */}
        <div className="grid grid-cols-2 gap-2">
          {/* Apply Discount */}
          <div>
            <label className="block mb-0.5 text-[9.5px] font-bold text-slate-500">Apply Discount (%)</label>
            <div className="flex items-center gap-1">
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="0"
                  className={cn(
                    "w-full rounded-lg border pl-5 pr-1.5 py-1 text-[11px] font-bold focus:border-teal-500 focus:outline-none transition",
                    discountApplied
                      ? (darkMode ? "border-emerald-500 bg-emerald-950/60 text-emerald-300" : "border-emerald-400 bg-emerald-50 text-slate-800")
                      : (darkMode ? "border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500" : "border-slate-200 bg-white text-slate-800 placeholder-slate-400")
                  )}
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
              id="pharma-note"
              rows={1}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add note..."
              className={cn(
                "w-full rounded-lg border px-2 py-1 text-[10.5px] font-semibold focus:border-teal-500 focus:outline-none resize-none transition",
                darkMode ? "border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500" : "border-slate-200 bg-white text-slate-800 placeholder-slate-400"
              )}
            />
          </div>
        </div>

        {/* Calculation Totals */}
        <div className={cn("space-y-1 rounded-xl border p-2 text-[11.5px] transition", darkMode ? "border-slate-700 bg-slate-800/80" : "border-slate-200 bg-slate-50/70")}>
          <div className={cn("flex justify-between font-semibold", darkMode ? "text-slate-300" : "text-slate-600")}>
            <span>Sub Total</span>
            <span className={cn("font-extrabold tabular-nums whitespace-nowrap", darkMode ? "text-slate-100" : "text-slate-800")}>৳ {subtotal.toFixed(2)}</span>
          </div>
          <div className={cn("flex justify-between font-semibold", darkMode ? "text-slate-300" : "text-slate-600")}>
            <span>Discount</span>
            <span className="font-extrabold tabular-nums text-emerald-500 whitespace-nowrap">− ৳ {totalDiscount.toFixed(2)}</span>
          </div>
          <div className={cn("flex justify-between font-semibold", darkMode ? "text-slate-300" : "text-slate-600")}>
            <span>VAT (5%)</span>
            <span className={cn("font-extrabold tabular-nums whitespace-nowrap", darkMode ? "text-slate-100" : "text-slate-800")}>৳ {vatAmount.toFixed(2)}</span>
          </div>
          <div className={cn("pt-1.5 border-t border-dashed flex items-baseline justify-between", darkMode ? "border-slate-700" : "border-slate-200")}>
            <span className={cn("text-[13px] font-black", darkMode ? "text-slate-100" : "text-slate-900")}>Total</span>
            <span className="text-[20px] font-black tabular-nums text-[#00796b] whitespace-nowrap">
              ৳ {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-5 gap-1">
          {PAY_METHODS.map(({ id, label, Icon }) => {
            const active = payMethod === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPayMethod(id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-lg border py-1.5 text-center transition",
                  active
                    ? "border-[#00796b] bg-[#e6f7f5] text-[#00796b]"
                    : darkMode
                      ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                )}
              >
                <Icon size={12} />
                <span className="text-[9.5px] font-bold">{label}</span>
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
        <div className="flex items-center gap-2">
          {/* Hold Bill */}
          <button
            type="button"
            onClick={holdBill}
            disabled={cart.length === 0}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border px-3 py-2.5 transition shadow-2xs disabled:opacity-40 shrink-0",
              darkMode ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            )}
          >
            <PauseCircle size={16} />
            <span className="text-[9.5px] font-extrabold mt-0.5">Hold Bill</span>
            <span className="text-[7.5px] font-semibold text-slate-400">(F6)</span>
          </button>

          {/* Pay Button */}
          <button
            type="button"
            disabled={cart.length === 0 || submitting}
            onClick={onOpenCheckout}
            className="flex-1 flex items-center justify-between rounded-2xl bg-[#00695c] px-4 py-3 text-white shadow-md hover:bg-[#005247] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Left: Cash Register Icon & Pay Text */}
            <div className="flex items-center gap-2">
              <CashRegisterIcon className="w-5 h-5 text-white shrink-0" />
              <span className="text-[16px] font-bold text-white tracking-wide">
                {submitting ? "Processing..." : "Pay"}
              </span>
            </div>

            {/* Center: Total Amount */}
            <div className="text-[17px] font-black text-white tabular-nums tracking-tight">
              ৳ {total.toFixed(2)}
            </div>

            {/* Right: Shortcut & Arrow */}
            <div className="flex items-center gap-1 text-white">
              <span className="text-[11.5px] font-semibold text-white/80">(F1)</span>
              <ArrowRight size={17} strokeWidth={2.5} className="shrink-0" />
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}
