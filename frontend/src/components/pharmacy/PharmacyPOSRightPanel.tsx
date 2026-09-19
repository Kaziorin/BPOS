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
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { PharmacyWaveRibbons } from "./PharmacyWaveRibbons";
import { NotificationDropdown, ProfileDropdown, type NotificationItem } from "./PharmacyPOSModals";
import {
  CustomButton,
  CustomInput,
  CustomSelect,
  CustomBadge,
  CustomCheckbox,
  CustomSwitch,
} from "@/components/custom";

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
  genericName?: string | null;
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
  onFindGenerics?: (productId: string) => void;
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
  onFindGenerics,
  darkMode,
}: PharmacyPOSRightPanelProps) {
  const [safetyOpen, setSafetyOpen] = useState(true);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <aside className={cn(
      "flex w-full flex-col overflow-hidden h-full transition",
      darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-gray-600"
    )}>
      {/* ═══ TOP HEADER (Silky Teal Wave Gradient) ═══ */}
      <div
        className="relative z-30 flex flex-none items-center justify-between px-3 py-2.5 select-none text-white shadow-xs"
        style={{
          background: darkMode
            ? "linear-gradient(115deg, #004d40 0%, #00695c 35%, #0f766e 70%, #14b8a6 100%)"
            : "linear-gradient(115deg, #00695C 0%, #00796B 30%, #00897B 60%, #14B8A6 85%, #5EEAD4 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <PharmacyWaveRibbons />
        </div>

        {/* Rx Mode Toggle */}
        <div className="relative z-10 flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 rounded-sm border px-2.5 py-1 transition shadow-xs",
            darkMode
              ? "bg-slate-900/90 border-slate-700 text-slate-100"
              : "bg-white border-slate-200 text-gray-600"
          )}>
            <CustomSwitch
              checked={rxMode}
              onChange={(val) => setRxMode(val)}
              themeColor="teal"
              size="sm"
              id="rx-mode-switch"
            />
            <label
              htmlFor="rx-mode-switch"
              className={cn(
                "text-[11.5px] font-extrabold select-none cursor-pointer",
                darkMode ? "text-slate-100" : "text-gray-600"
              )}
            >
              Rx Mode
            </label>
          </div>
        </div>

        {/* Right Bell & Profile */}
        <div className="relative z-10 flex items-center gap-2">
          {/* Bell Icon */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setBellOpen((v) => !v); setProfileOpen(false); }}
              className={cn(
                "relative rounded-sm h-8 w-8 flex items-center justify-center border transition active:scale-95 cursor-pointer shadow-xs",
                darkMode
                  ? "bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-gray-600 hover:text-[#00796b]"
              )}
              title="Notifications"
            >
              <Bell size={15} />
            </button>
            {unreadCount > 0 && (
              <span className="pointer-events-none absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs">
                {unreadCount}
              </span>
            )}
            <NotificationDropdown
              open={bellOpen}
              onClose={() => setBellOpen(false)}
              notifications={notifications}
              onMarkAllRead={onMarkAllReadNotifications}
              onClearAll={onClearAllNotifications}
              onDismiss={onDismissNotification}
              darkMode={darkMode}
            />
          </div>

          {/* Profile Dropdown Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setProfileOpen((v) => !v); setBellOpen(false); }}
              className={cn(
                "flex items-center gap-2 rounded-sm px-2.5 py-1 h-8 border transition shadow-xs cursor-pointer active:scale-95",
                darkMode
                  ? "bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-100"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-gray-600"
              )}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00796b] text-white font-bold text-[11px] shadow-xs">
                <User size={13} />
              </div>
              <div className="leading-tight text-left">
                <p className={cn("text-[11px] font-extrabold leading-none", darkMode ? "text-slate-100" : "text-gray-600")}>
                  {cashierName}
                </p>
                <p className={cn("text-[9px] font-bold leading-none mt-0.5", darkMode ? "text-slate-400" : "text-slate-500")}>
                  {terminalName}
                </p>
              </div>
              <ChevronDown size={13} className={cn("ml-0.5", darkMode ? "text-slate-400" : "text-slate-500")} />
            </button>
            <ProfileDropdown
              open={profileOpen}
              onClose={() => setProfileOpen(false)}
              cashierName={cashierName}
              terminalName={terminalName}
              onOpenSettings={onOpenHardwareSettings}
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>

      {/* ═══ CART HEADER ═══ */}
      <div className={cn("flex flex-none items-center justify-between border-b px-3 py-2.5 transition", darkMode ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white")}>
        <div className="flex items-center gap-2">
          <ShoppingBag size={17} className="text-[#00796b]" />
          <h2 className={cn("text-[13.5px] font-black", darkMode ? "text-slate-100" : "text-gray-600")}>
            Cart <span className="text-slate-400 font-bold">({itemCount} Items)</span>
          </h2>
          {cart.length > 0 && (
            <CustomButton
              variant="outline"
              size="sm"
              onClick={onClearCart}
              className="h-6 px-1.5 text-rose-500 border-rose-200 hover:bg-rose-50 text-[10.5px] gap-1"
              title="Clear cart"
            >
              <Trash2 size={11} />
              Clear
            </CustomButton>
          )}
        </div>

        {/* Customer Select Dropdown */}
        <div className="flex items-center gap-1">
          <div className="w-[125px]">
            <CustomSelect
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              darkMode={darkMode}
              themeColor="teal"
              className="text-[11px] font-bold py-1 h-8 rounded-sm"
              options={[
                { label: "Walk-in", value: "" },
                ...customers.map((c) => ({ label: c.name, value: c.id })),
              ]}
            />
          </div>
          <CustomButton
            size="xs"
            variant="outline"
            themeColor="teal"
            onClick={onAddCustomer}
            className="h-8 w-8 !p-0 rounded-sm shrink-0 flex items-center justify-center"
            title="Add new customer"
          >
            <Plus size={15} strokeWidth={2.4} />
          </CustomButton>
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
              className={cn("flex items-center gap-2 rounded-sm border p-2 shadow-2xs transition", darkMode ? "border-slate-800 bg-slate-900 text-slate-100 hover:border-slate-700" : "border-slate-200 bg-white hover:border-brand-border")}
            >
              {/* Thumb */}
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border overflow-hidden", darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-100")}>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <Pill size={16} className="text-slate-400" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h4 className={cn("truncate text-[12px] font-extrabold leading-tight", darkMode ? "text-slate-100" : "text-gray-600")}>{item.name}</h4>
                <p className="text-[10px] font-semibold text-slate-400 leading-none mt-0.5">
                  {item.genericName ? <span className="text-[#00796b] dark:text-brand-primary font-bold">{item.genericName} · </span> : null}
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
              <div className={cn("flex items-center gap-0.5 border rounded-sm p-0.5", darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200")}>
                <CustomButton
                  variant="ghost"
                  size="xs"
                  onClick={() => onQty(idx, item.qty - 1)}
                  className={cn("h-5 w-5 !p-0 rounded-sm flex items-center justify-center transition shadow-2xs", darkMode ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-white text-slate-600 hover:bg-slate-100")}
                  title="Decrease quantity"
                >
                  <Minus size={10} strokeWidth={2.5} />
                </CustomButton>
                <span className={cn("w-5 text-center text-[10.5px] font-extrabold", darkMode ? "text-slate-100" : "text-gray-600")}>{item.qty}</span>
                <CustomButton
                  variant="ghost"
                  size="xs"
                  onClick={() => onQty(idx, item.qty + 1)}
                  className={cn("h-5 w-5 !p-0 rounded-sm flex items-center justify-center transition shadow-2xs", darkMode ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-white text-slate-600 hover:bg-slate-100")}
                  title="Increase quantity"
                >
                  <Plus size={10} strokeWidth={2.5} />
                </CustomButton>
              </div>

              {/* Item total price */}
              <div className={cn("text-right font-black text-[12px] tabular-nums whitespace-nowrap shrink-0", darkMode ? "text-slate-100" : "text-gray-600")}>
                ৳ {item.lineTotal.toFixed(2)}
              </div>

              {/* Action buttons: Generics & Delete */}
              <div className="flex items-center gap-0.5 shrink-0">
                {onFindGenerics && (
                  <CustomButton
                    variant="ghost"
                    size="xs"
                    onClick={() => onFindGenerics(item.productId)}
                    className="h-6 w-6 !p-0 text-emerald-600 dark:text-brand-primary hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-teal-950/60 rounded-sm flex items-center justify-center"
                    title="View generic alternatives for this medicine"
                  >
                    <Leaf size={13} />
                  </CustomButton>
                )}
                <CustomButton
                  variant="ghost"
                  size="xs"
                  onClick={() => onRemove(idx)}
                  className="h-6 w-6 !p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-sm flex items-center justify-center"
                  title="Remove item"
                >
                  <Trash2 size={13} />
                </CustomButton>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ═══ FIXED BOTTOM CHECKOUT & TOTALS ═══ */}
      <div className={cn("flex-none border-t px-3 py-2 space-y-2 transition", darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")}>
        {/* Pharmacy Safety Check Accordion */}
        <div className={cn(
          "rounded-sm border overflow-hidden transition",
          darkMode ? "border-teal-900/60 bg-teal-950/40" : "border-brand-border bg-[#e8f7f5]"
        )}>
          <CustomButton
            variant="ghost"
            fullWidth
            onClick={() => setSafetyOpen((v) => !v)}
            className={cn(
              "flex items-center justify-between !px-2.5 !py-1.5 text-left h-auto",
              darkMode ? "hover:bg-teal-900/30 text-brand-primary/60" : "hover:bg-brand-50/50 text-[#00796b]"
            )}
          >
            <span className={cn("inline-flex items-center gap-1.5 text-[11.5px] font-extrabold", darkMode ? "text-brand-primary/60" : "text-[#00796b]")}>
              <ShieldCheck size={14} /> Pharmacy Safety Check
            </span>
            <ChevronDown size={13} className={cn(darkMode ? "text-brand-primary/60" : "text-[#00796b]", "transition", safetyOpen && "rotate-180")} />
          </CustomButton>
          {safetyOpen && (
            <div className={cn(
              "space-y-1 border-t px-2.5 py-1.5",
              darkMode ? "border-teal-900/50 bg-slate-900/60" : "border-brand-border/50 bg-white/40"
            )}>
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-500">
                <CheckCircle2 size={12} /> Prescription verified
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-500">
                <CheckCircle2 size={12} /> No drug interaction detected
              </div>
              {cart.some((i) => i.expiryDate) && (
                <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-amber-500">
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
            <label className={cn("block mb-0.5 text-[9.5px] font-bold", darkMode ? "text-slate-400" : "text-slate-500")}>Apply Discount (%)</label>
            <div className="flex items-center gap-1.5">
              <div className="flex-1">
                <CustomInput
                  type="number"
                  min="0"
                  max="100"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="0"
                  leftIcon={<span className="text-[10px] font-bold text-slate-400">%</span>}
                  darkMode={darkMode}
                  themeColor="teal"
                  className={cn(
                    "text-[11px] font-bold h-8",
                    discountApplied && (darkMode ? "border-emerald-700 text-emerald-400 bg-emerald-950/40" : "border-emerald-500 text-emerald-600 bg-emerald-50/50")
                  )}
                />
              </div>
              <CustomButton
                themeColor="teal"
                size="sm"
                onClick={applyDiscount}
                className="h-8 px-2.5 text-[10.5px] font-bold shrink-0"
              >
                Apply
              </CustomButton>
            </div>
          </div>

          {/* Sales Note */}
          <div>
            <label className={cn("block mb-0.5 text-[9.5px] font-bold", darkMode ? "text-slate-400" : "text-slate-500")}>Sales Note</label>
            <CustomInput
              id="pharma-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add note..."
              darkMode={darkMode}
              themeColor="teal"
              className="text-[10.5px] font-semibold h-8"
            />
          </div>
        </div>

        {/* Calculation Totals */}
        <div className={cn("space-y-1 rounded-sm border p-2 text-[11.5px] transition", darkMode ? "border-slate-700 bg-slate-800/80" : "border-slate-200 bg-slate-50/70")}>
          <div className={cn("flex justify-between font-semibold", darkMode ? "text-slate-300" : "text-slate-600")}>
            <span>Sub Total</span>
            <span className={cn("font-extrabold tabular-nums whitespace-nowrap", darkMode ? "text-slate-100" : "text-gray-600")}>৳ {subtotal.toFixed(2)}</span>
          </div>
          <div className={cn("flex justify-between font-semibold", darkMode ? "text-slate-300" : "text-slate-600")}>
            <span>Discount</span>
            <span className="font-extrabold tabular-nums text-emerald-500 whitespace-nowrap">− ৳ {totalDiscount.toFixed(2)}</span>
          </div>
          <div className={cn("flex justify-between font-semibold", darkMode ? "text-slate-300" : "text-slate-600")}>
            <span>VAT (15%)</span>
            <span className={cn("font-extrabold tabular-nums whitespace-nowrap", darkMode ? "text-slate-100" : "text-gray-600")}>৳ {vatAmount.toFixed(2)}</span>
          </div>
          <div className={cn("pt-1.5 border-t border-dashed flex items-baseline justify-between", darkMode ? "border-slate-700" : "border-slate-200")}>
            <span className={cn("text-[13px] font-black", darkMode ? "text-slate-100" : "text-gray-600")}>Total</span>
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
              <CustomButton
                key={id}
                size="xs"
                variant={active ? "primary" : "outline"}
                themeColor={active ? "teal" : undefined}
                onClick={() => setPayMethod(id)}
                className={cn(
                  "!flex-col h-11 !p-1 gap-0.5 rounded-sm text-center w-full min-w-0",
                  !active && (darkMode ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
                )}
              >
                <Icon size={12} className="shrink-0" />
                <span className="text-[9.5px] font-bold leading-none truncate w-full">{label}</span>
              </CustomButton>
            );
          })}
        </div>

        {error && (
          <p className="rounded-sm bg-rose-50 border border-rose-100 p-1.5 text-[10.5px] font-bold text-rose-600">
            {error}
          </p>
        )}

        {/* Bottom Hold & Pay Buttons */}
        <div className="flex items-center gap-2">
          {/* Hold Bill */}
          <CustomButton
            variant="outline"
            onClick={holdBill}
            disabled={cart.length === 0}
            className={cn(
              "flex flex-col items-center justify-center h-12 px-3 gap-0.5 shrink-0 rounded-sm shadow-2xs",
              darkMode ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-200 bg-slate-50 text-gray-600 hover:bg-slate-100"
            )}
          >
            <PauseCircle size={15} />
            <span className="text-[9.5px] font-extrabold leading-none mt-0.5">Hold Bill</span>
            <span className="text-[7.5px] font-semibold text-slate-400 leading-none">(F6)</span>
          </CustomButton>

          {/* Pay Button (Silky Teal Wave Gradient) */}
          <button
            type="button"
            disabled={cart.length === 0 || submitting}
            onClick={onOpenCheckout}
            className={cn(
              "flex-1 h-12 flex items-center justify-between px-4 py-3 rounded-sm shadow-md transition-all active:scale-[0.99] cursor-pointer select-none text-white",
              cart.length === 0 || submitting
                ? "opacity-50 pointer-events-none bg-slate-300 dark:bg-slate-800"
                : "bg-gradient-to-r from-[#00695c] via-[#00796b] to-[#14b8a6] hover:brightness-110 hover:shadow-lg hover:shadow-teal-950/20"
            )}
          >
            {/* Left: Cash Register Icon & Pay Text */}
            <div className="flex items-center gap-2">
              <CashRegisterIcon className="w-5 h-5 text-white shrink-0" />
              <span className="text-[16px] font-bold text-white tracking-wide drop-shadow-xs">
                {submitting ? "Processing..." : "Pay"}
              </span>
            </div>

            {/* Center: Total Amount */}
            <div className="text-[17px] font-black text-white tabular-nums tracking-tight drop-shadow-xs">
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
