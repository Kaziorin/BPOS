"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ScanLine, Trash2, Settings2, Plus, Minus, X, Package, PauseCircle, Truck } from "lucide-react";
import { cn } from "@/lib/cn";
import { CustomButton, CustomInput, CustomSelect } from "@/components/custom";
import type { DiscountMode, WsCartItem } from "./wholesale-pos-types";

function fmt(n: number) {
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface WholesalePOSRightPanelProps {
  cart: WsCartItem[];
  subtotal: number;
  discountMode: DiscountMode;
  setDiscountMode: (m: DiscountMode) => void;
  discountInput: string;
  setDiscountInput: (v: string) => void;
  discountAmount: number;
  taxAmount: number;
  taxRate: number;
  shipping: number;
  setShipping: (n: number) => void;
  total: number;
  onQty: (idx: number, qty: number) => void;
  onRemove: (idx: number) => void;
  onClearCart: () => void;
  onScanItem?: () => void;
  onHold?: () => void;
  onProceed?: () => void;
  note?: string;
  setNote?: (v: string) => void;
  submitting?: boolean;
  darkMode?: boolean;
}

export function WholesalePOSRightPanel({
  cart,
  subtotal,
  discountMode,
  setDiscountMode,
  discountInput,
  setDiscountInput,
  discountAmount,
  taxAmount,
  taxRate,
  shipping,
  setShipping,
  total,
  onQty,
  onRemove,
  onClearCart,
  onScanItem,
  onHold,
  onProceed,
  note = "",
  setNote,
  submitting = false,
  darkMode = false,
}: WholesalePOSRightPanelProps) {
  const darkField =
    "!bg-slate-800 !border-slate-700 !text-slate-100 placeholder:!text-slate-500";

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[22px] backdrop-blur-xl",
        darkMode
          ? "border border-slate-700 bg-slate-900/95 shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
          : "border border-white bg-white shadow-[0_4px_24px_rgba(37,99,235,0.06)]",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3.5",
          darkMode ? "border-slate-800" : "border-slate-50",
        )}
      >
        <h2
          className={cn(
            "text-[15px] font-bold",
            darkMode ? "text-slate-100" : "text-slate-900",
          )}
        >
          Order Items <span className="text-blue-600">({cart.length})</span>
        </h2>
        <div className="flex items-center gap-1.5">
          <CustomButton
            type="button"
            size="sm"
            variant="secondary"
            themeColor="blue"
            onClick={onScanItem}
            leftIcon={<ScanLine size={13} />}
            className={cn(
              "!rounded-xl",
              darkMode
                ? "!bg-blue-500/15 !text-blue-300 hover:!bg-blue-500/25"
                : "!bg-blue-50 !text-blue-700 hover:!bg-blue-100",
            )}
          >
            Scan Item
          </CustomButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2 no-scrollbar">
        {/* ... AnimatePresence items ... */}
        <AnimatePresence initial={false}>
          {cart.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "flex h-full min-h-[160px] flex-col items-center justify-center gap-2",
                darkMode ? "text-slate-500" : "text-slate-300",
              )}
            >
              <Package size={32} className="opacity-35" />
              <p className="text-[13px] font-semibold">No items yet</p>
            </motion.div>
          ) : (
            cart.map((item, idx) => (
              <motion.div
                key={`${item.productId}-${idx}`}
                layout
                initial={{ opacity: 0, x: 24, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                className={cn(
                  "group relative flex gap-2.5 rounded-2xl border p-2.5 transition-all",
                  darkMode
                    ? "border-slate-700 bg-slate-900/60"
                    : "border-slate-50 bg-slate-50/40 hover:border-blue-100 hover:bg-white hover:shadow-sm",
                )}
              >
                {/* ... item content ... */}
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-inner",
                    darkMode
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-100 bg-white",
                  )}
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="h-full w-full object-contain p-0.5" />
                  ) : (
                    <Package
                      size={18}
                      className={darkMode ? "text-slate-500" : "text-slate-200"}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "line-clamp-1 text-[12px] font-bold leading-snug",
                          darkMode ? "text-slate-100" : "text-slate-900",
                        )}
                      >
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                        {item.sku}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      className="text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className={cn(
                      "flex items-center rounded-lg border",
                      darkMode ? "border-slate-700 bg-slate-950" : "border-slate-100 bg-white"
                    )}>
                      <button onClick={() => onQty(idx, item.qty - 1)} className="p-1 px-2 hover:bg-slate-50 text-slate-400"><Minus size={12} /></button>
                      <span className="px-1 text-[12px] font-black text-blue-600">{item.qty}</span>
                      <button onClick={() => onQty(idx, item.qty + 1)} className="p-1 px-2 hover:bg-slate-50 text-slate-400"><Plus size={12} /></button>
                    </div>
                    <p className={cn("text-[13px] font-black tabular-nums", darkMode ? "text-slate-100" : "text-slate-900")}>
                      {fmt(item.lineTotal)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div
        className={cn(
          "shrink-0 space-y-2 border-t px-4 py-3.5",
          darkMode
            ? "border-slate-700 bg-slate-900"
            : "border-slate-50 bg-slate-50/50",
        )}
      >
        <Row label="Subtotal" value={fmt(subtotal)} darkMode={darkMode} />
        {/* ... discount/tax/shipping ... */}
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-semibold text-slate-500">Tax (15%)</span>
          <span className="font-bold text-slate-700">{fmt(taxAmount)}</span>
        </div>

        <div className="flex items-end justify-between border-t border-dashed border-slate-200 pt-3">
          <span className={cn("text-[13px] font-bold", darkMode ? "text-slate-400" : "text-slate-500")}>
            Total Amount
          </span>
          <span className="text-[26px] font-black leading-none tracking-tight tabular-nums text-blue-600">
            {fmt(total)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <CustomButton
            type="button"
            variant="outline"
            size="lg"
            onClick={onHold}
            disabled={cart.length === 0}
            className={cn(
              "!h-11 !rounded-2xl !border-2 !border-blue-200 !px-4 !text-[13px] !font-black !text-blue-600",
              darkMode ? "!bg-slate-900 !border-slate-700 !text-slate-300" : "!bg-white hover:!bg-blue-50",
            )}
          >
            Hold Order
          </CustomButton>

          <CustomButton
            type="button"
            size="lg"
            themeColor="blue"
            disabled={cart.length === 0 || submitting}
            onClick={onProceed}
            className="!h-11 !rounded-2xl !px-4 !text-[13px] !font-black uppercase tracking-wide shadow-lg shadow-blue-600/20"
          >
            {submitting ? "Wait…" : "Proceed"}
          </CustomButton>
        </div>
      </div>
    </aside>
  );
}

function Row({
  label,
  value,
  valueClass,
  darkMode = false,
}: {
  label: string;
  value: string;
  valueClass?: string;
  darkMode?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          "text-[12px] font-semibold",
          darkMode ? "text-slate-400" : "text-gray-500",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-[12px] font-bold tabular-nums",
          darkMode ? "text-slate-100" : "text-gray-800",
          valueClass,
        )}
      >
        {value}
      </span>
    </div>
  );
}
