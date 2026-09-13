"use client";

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
        "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[22px] backdrop-blur-xl transition-all",
        darkMode
          ? "border border-slate-700 bg-slate-900/95 shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
          : "border border-slate-200/90 bg-white shadow-md shadow-slate-200/50",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3.5",
          darkMode ? "border-slate-800" : "border-slate-200 bg-slate-50/50",
        )}
      >
        <h2
          className={cn(
            "text-[15px] font-extrabold",
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
              "!rounded-xl !font-bold cursor-pointer transition-all",
              darkMode
                ? "!bg-blue-500/15 !text-blue-300 hover:!bg-blue-500/25"
                : "!bg-blue-600 !text-white hover:!bg-blue-700 shadow-xs",
            )}
          >
            Scan Item
          </CustomButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2.5 no-scrollbar">
        {cart.length === 0 ? (
          <div
            className={cn(
              "flex h-full min-h-[160px] flex-col items-center justify-center gap-2 text-center",
              darkMode ? "text-slate-500" : "text-slate-400",
            )}
          >
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border shadow-xs", darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-400")}>
              <Package size={24} />
            </div>
            <p className={cn("text-[13px] font-bold mt-1", darkMode ? "text-slate-400" : "text-slate-600")}>No items in cart</p>
            <p className={cn("text-[11px] font-medium max-w-[180px]", darkMode ? "text-slate-600" : "text-slate-400")}>Click products on the left or scan barcodes to add</p>
          </div>
        ) : (
          cart.map((item, idx) => (
            <div
              key={`${item.productId}-${idx}`}
              className={cn(
                "group relative flex gap-2.5 rounded-xl border p-2.5 transition-all shadow-xs",
                darkMode
                  ? "border-slate-700 bg-slate-900/60"
                  : "border-slate-200 bg-slate-50/70 hover:border-blue-300 hover:bg-white hover:shadow-sm",
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border",
                  darkMode
                    ? "border-slate-700 bg-slate-950"
                    : "border-slate-200 bg-white",
                )}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="h-full w-full object-contain p-0.5" />
                ) : (
                  <Package
                    size={18}
                    className={darkMode ? "text-slate-500" : "text-slate-400"}
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
                    <p className={cn("mt-0.5 text-[10px] font-semibold", darkMode ? "text-slate-400" : "text-slate-500")}>
                      {item.sku}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className={cn(
                    "flex items-center rounded-lg border shadow-2xs",
                    darkMode ? "border-slate-700 bg-slate-950" : "border-slate-300 bg-white"
                  )}>
                    <button onClick={() => onQty(idx, item.qty - 1)} className="p-1 px-2 hover:bg-slate-100 text-slate-600 cursor-pointer"><Minus size={12} /></button>
                    <span className="px-1.5 text-[12px] font-extrabold text-blue-600">{item.qty}</span>
                    <button onClick={() => onQty(idx, item.qty + 1)} className="p-1 px-2 hover:bg-slate-100 text-slate-600 cursor-pointer"><Plus size={12} /></button>
                  </div>
                  <p className={cn("text-[13px] font-extrabold tabular-nums", darkMode ? "text-slate-100" : "text-slate-900")}>
                    {fmt(item.lineTotal)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div
        className={cn(
          "shrink-0 space-y-2 border-t px-4 py-3.5 transition-colors",
          darkMode
            ? "border-slate-700 bg-slate-900"
            : "border-slate-200 bg-slate-50/90",
        )}
      >
        <Row label="Subtotal" value={fmt(subtotal)} darkMode={darkMode} />
        <div className="flex items-center justify-between text-[12px]">
          <span className={cn("font-semibold", darkMode ? "text-slate-400" : "text-slate-600")}>Tax (15%)</span>
          <span className={cn("font-bold tabular-nums", darkMode ? "text-slate-200" : "text-slate-800")}>{fmt(taxAmount)}</span>
        </div>

        <div className="flex items-end justify-between border-t border-dashed border-slate-300 dark:border-slate-700 pt-3">
          <span className={cn("text-[13px] font-extrabold", darkMode ? "text-slate-300" : "text-slate-800")}>
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
              "!h-11 !rounded-xl !border-2 !px-4 !text-[13px] !font-extrabold cursor-pointer transition-all",
              darkMode
                ? "!bg-slate-900 !border-slate-700 !text-slate-300 hover:!bg-slate-800"
                : "!bg-white !border-slate-300 !text-slate-800 hover:!border-blue-500 hover:!text-blue-600 hover:!bg-blue-50/50 shadow-sm",
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
            className="!h-11 !rounded-xl !px-4 !text-[13px] !font-black uppercase tracking-wide shadow-md shadow-blue-600/20 cursor-pointer"
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
          darkMode ? "text-slate-400" : "text-slate-600",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-[12px] font-bold tabular-nums",
          darkMode ? "text-slate-100" : "text-slate-900",
          valueClass,
        )}
      >
        {value}
      </span>
    </div>
  );
}
