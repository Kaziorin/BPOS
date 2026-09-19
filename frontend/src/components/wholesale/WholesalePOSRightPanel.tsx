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
  const iceBlue = "#146EF5";
  const darkText = "#10213D";
  const mutedText = "#64748B";
  const iceBorder = "#DCE8F2";
  const iceCard = "#FFFFFF";

  const darkField =
    "!bg-slate-800 !border-slate-700 !text-slate-100 placeholder:!text-slate-500";

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-sm backdrop-blur-xl transition-all",
        darkMode
          ? "border border-slate-700 bg-slate-900/95 shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
          : "shadow-[0_4px_24px_rgba(20,110,245,0.1)]",
      )}
      style={darkMode ? undefined : { background: iceCard, border: `1px solid ${iceBorder}` }}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3.5",
          darkMode ? "border-slate-800" : "",
        )}
        style={darkMode ? undefined : { borderColor: iceBorder, background: "#F5FAFE" }}
      >
        <h2
          className={cn(
            "text-[15px] font-extrabold",
            darkMode ? "text-slate-100" : "",
          )}
          style={darkMode ? undefined : { color: darkText }}
        >
          Order Items <span style={{ color: iceBlue }}>({cart.length})</span>
        </h2>
        <div className="flex items-center gap-1.5">
          {cart.length > 0 && (
            <CustomButton
              variant="outline"
              size="xs"
              onClick={onClearCart}
              title="Clear entire cart"
              className={cn(
                "rounded-sm px-2.5 py-1.5 text-[11.5px] font-extrabold h-auto shadow-2xs gap-1.5",
                darkMode
                  ? "border-rose-500/30 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                  : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700",
              )}
            >
              <Trash2 size={13} strokeWidth={2.2} />
              <span>Clear Cart</span>
            </CustomButton>
          )}
          <CustomButton
            type="button"
            size="sm"
            variant="secondary"
            themeColor="blue"
            onClick={onScanItem}
            leftIcon={<ScanLine size={13} />}
            className={cn(
              "!rounded-sm !font-bold cursor-pointer transition-all",
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
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-sm border shadow-xs",
                darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "",
              )}
              style={darkMode ? undefined : { background: "#EBF3FE", border: `1px solid #BEDCFD`, color: iceBlue }}
            >
              <Package size={24} />
            </div>
            <p
              className={cn("text-[13px] font-bold mt-1", darkMode ? "text-slate-400" : "")}
              style={darkMode ? undefined : { color: darkText }}
            >
              No items in cart
            </p>
            <p
              className={cn("text-[11px] font-medium max-w-[180px]", darkMode ? "text-slate-600" : "")}
              style={darkMode ? undefined : { color: mutedText }}
            >
              Click products on the left or scan barcodes to add
            </p>
          </div>
        ) : (
          cart.map((item, idx) => (
            <div
              key={`${item.productId}-${idx}`}
              className={cn(
                "group relative flex gap-2.5 rounded-sm border p-2.5 transition-all shadow-xs",
                darkMode
                  ? "border-slate-700 bg-slate-900/60"
                  : "hover:shadow-sm",
              )}
              style={darkMode ? undefined : { background: "#F5FAFE", border: `1px solid ${iceBorder}` }}
            >
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-sm border",
                  darkMode ? "border-slate-700 bg-slate-950" : "",
                )}
                style={darkMode ? undefined : { background: iceCard, border: `1px solid ${iceBorder}` }}
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
                        darkMode ? "text-slate-100" : "text-gray-600",
                      )}
                    >
                      {item.name}
                    </p>
                    <p
                      className={cn("mt-0.5 text-[10px] font-semibold", darkMode ? "text-slate-400" : "")}
                      style={darkMode ? undefined : { color: mutedText }}
                    >
                      {item.sku}
                    </p>
                  </div>
                  <CustomButton
                    variant="ghost"
                    size="xs"
                    onClick={() => onRemove(idx)}
                    className="h-6 w-6 !p-0 text-slate-400 hover:text-rose-600 rounded-sm flex items-center justify-center"
                    title="Remove item"
                  >
                    <X size={15} />
                  </CustomButton>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div
                    className={cn(
                      "flex items-center rounded-sm border shadow-2xs overflow-hidden",
                      darkMode ? "border-slate-700 bg-slate-950" : "",
                    )}
                    style={darkMode ? undefined : { border: `1px solid ${iceBorder}`, background: iceCard }}
                  >
                    <CustomButton
                      variant="ghost"
                      size="xs"
                      onClick={() => onQty(idx, item.qty - 1)}
                      className="h-6 w-6 !p-0 rounded-none text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                    >
                      <Minus size={12} />
                    </CustomButton>
                    <span className="px-2 text-[12px] font-extrabold text-blue-600">{item.qty}</span>
                    <CustomButton
                      variant="ghost"
                      size="xs"
                      onClick={() => onQty(idx, item.qty + 1)}
                      className="h-6 w-6 !p-0 rounded-none text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                    >
                      <Plus size={12} />
                    </CustomButton>
                  </div>
                  <p
                    className={cn("text-[13px] font-extrabold tabular-nums", darkMode ? "text-slate-100" : "")}
                    style={darkMode ? undefined : { color: darkText }}
                  >
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
          darkMode ? "border-slate-700 bg-slate-900" : "",
        )}
        style={darkMode ? undefined : { borderColor: iceBorder, background: "#F5FAFE" }}
      >
        <Row label="Subtotal" value={fmt(subtotal)} darkMode={darkMode} />
        <div className="flex items-center justify-between text-[12px]">
          <span
            className={cn("font-semibold", darkMode ? "text-slate-400" : "")}
            style={darkMode ? undefined : { color: mutedText }}
          >
            Tax (15%)
          </span>
          <span
            className={cn("font-bold tabular-nums", darkMode ? "text-slate-200" : "")}
            style={darkMode ? undefined : { color: darkText }}
          >
            {fmt(taxAmount)}
          </span>
        </div>

        <div className="flex items-end justify-between border-t border-dashed pt-3"
          style={{ borderColor: darkMode ? "#334155" : "#DCE8F2" }}
        >
          <span
            className={cn("text-[13px] font-extrabold", darkMode ? "text-slate-300" : "")}
            style={darkMode ? undefined : { color: darkText }}
          >
            Total Amount
          </span>
          <span
            className="text-[26px] font-black leading-none tracking-tight tabular-nums"
            style={{ color: iceBlue }}
          >
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
              "!h-11 !rounded-sm !border-2 !px-4 !text-[13px] !font-extrabold cursor-pointer transition-all",
              darkMode
                ? "!bg-slate-900 !border-slate-700 !text-slate-300 hover:!bg-slate-800"
                : "hover:!shadow-md",
            )}
            style={darkMode ? undefined : {
              background: iceCard,
              borderColor: iceBorder,
              color: darkText,
            }}
          >
            Hold Order
          </CustomButton>

          <CustomButton
            type="button"
            size="lg"
            themeColor="blue"
            disabled={cart.length === 0 || submitting}
            onClick={onProceed}
            className="!h-11 !rounded-sm !px-4 !text-[13px] !font-black uppercase tracking-wide shadow-md shadow-blue-600/20 cursor-pointer"
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
  iceBlueColor,
  darkTextColor,
  mutedTextColor,
}: {
  label: string;
  value: string;
  valueClass?: string;
  darkMode?: boolean;
  iceBlueColor?: string;
  darkTextColor?: string;
  mutedTextColor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          "text-[12px] font-semibold",
          darkMode ? "text-slate-400" : "",
        )}
        style={darkMode ? undefined : { color: mutedTextColor || "#64748B" }}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-[12px] font-bold tabular-nums",
          darkMode ? "text-slate-100" : "",
          valueClass,
        )}
        style={darkMode ? undefined : { color: darkTextColor || "#10213D" }}
      >
        {value}
      </span>
    </div>
  );
}
