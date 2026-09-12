"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ScanLine, Trash2, Settings2, Plus, Minus, X, Package, PauseCircle, Truck } from "lucide-react";
import { cn } from "@/lib/cn";
import { CustomButton, CustomInput, CustomSelect } from "@/components/custom";
import type { DiscountMode, WsCartItem } from "./wholesale-pos-types";

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
          : "border border-primary-100/70 bg-white/95 shadow-[0_8px_40px_rgba(0,102,255,0.08)]",
      )}
    >
      {/* ... existing header and cart body ... */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3.5",
          darkMode ? "border-slate-800" : "border-gray-100",
        )}
      >
        <h2
          className={cn(
            "text-[15px] font-bold",
            darkMode ? "text-slate-100" : "text-gray-900",
          )}
        >
          Order Items <span className="text-primary-600">({cart.length})</span>
        </h2>
        <div className="flex items-center gap-1.5">
          <CustomButton
            type="button"
            size="sm"
            variant="secondary"
            onClick={onScanItem}
            leftIcon={<ScanLine size={13} />}
            className={cn(
              "!rounded-xl",
              darkMode
                ? "!bg-primary-500/15 !text-primary-300 hover:!bg-primary-500/25"
                : "!bg-primary-50 !text-primary-700 hover:!bg-primary-100",
            )}
          >
            Scan Item
          </CustomButton>
          <CustomButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearCart}
            disabled={cart.length === 0}
            className={cn(
              "!h-8 !w-8 !rounded-xl !px-0 hover:!bg-rose-50 hover:!text-rose-500",
              darkMode && "!text-slate-400 hover:!bg-rose-500/15 hover:!text-rose-400",
            )}
            title="Clear cart"
          >
            <Trash2 size={15} />
          </CustomButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2">
        <AnimatePresence initial={false}>
          {cart.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "flex h-full min-h-[160px] flex-col items-center justify-center gap-2",
                darkMode ? "text-slate-500" : "text-gray-400",
              )}
            >
              <Package size={32} className="opacity-35" />
              <p className="text-[13px] font-semibold">No items yet</p>
              <p className={cn("text-[11px]", darkMode ? "text-slate-500" : "text-gray-400")}>
                Tap + on a product to add
              </p>
            </motion.div>
          ) : (
            cart.map((item, idx) => (
              <motion.div
                key={`${item.productId}-${idx}`}
                layout
                initial={{ opacity: 0, x: 24, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className={cn(
                  "group relative flex gap-2.5 rounded-2xl border p-2.5 shadow-sm transition-shadow",
                  darkMode
                    ? "border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900/80 hover:border-primary-500/40 hover:shadow-md hover:shadow-primary-600/10"
                    : "border-gray-100 bg-gradient-to-br from-white to-gray-50/80 hover:border-primary-100 hover:shadow-md",
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-inner",
                    darkMode
                      ? "border-slate-700 bg-slate-900"
                      : "border-gray-100 bg-white",
                  )}
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="h-full w-full object-contain p-0.5" />
                  ) : (
                    <Package
                      size={18}
                      className={darkMode ? "text-slate-500" : "text-gray-300"}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "line-clamp-1 text-[12px] font-bold leading-snug",
                          darkMode ? "text-slate-100" : "text-gray-900",
                        )}
                      >
                        {item.name}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-[10px] font-medium",
                          darkMode ? "text-slate-500" : "text-gray-400",
                        )}
                      >
                        {item.sku}
                        {item.warehouseName ? ` · ${item.warehouseName}` : ""}
                      </p>
                    </div>
                    <CustomButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(idx)}
                      className={cn(
                        "!h-6 !w-6 shrink-0 !rounded-lg !px-0 hover:!bg-rose-50 hover:!text-rose-500",
                        darkMode
                          ? "text-slate-600 hover:!bg-rose-500/15 hover:!text-rose-400"
                          : "text-gray-300",
                      )}
                    >
                      <X size={13} strokeWidth={2.5} />
                    </CustomButton>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div
                      className={cn(
                        "inline-flex items-center overflow-hidden rounded-lg border shadow-sm",
                        darkMode
                          ? "border-slate-700 bg-slate-900"
                          : "border-gray-200 bg-white",
                      )}
                    >
                      <CustomButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onQty(idx, item.qty - 1)}
                        className={cn(
                          "!h-7 !w-7 !rounded-none !px-0",
                          darkMode && "!text-slate-300 hover:!bg-slate-800",
                        )}
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </CustomButton>
                      <span
                        className={cn(
                          "w-8 text-center text-[12px] font-bold tabular-nums",
                          darkMode ? "text-slate-100" : "text-gray-800",
                        )}
                      >
                        {item.qty}
                      </span>
                      <CustomButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onQty(idx, item.qty + 1)}
                        className={cn(
                          "!h-7 !w-7 !rounded-none !px-0",
                          darkMode && "!text-slate-300 hover:!bg-slate-800",
                        )}
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </CustomButton>
                    </div>

                    <div className="text-right">
                      <p
                        className={cn(
                          "text-[10px] tabular-nums",
                          darkMode ? "text-slate-500" : "text-gray-400",
                        )}
                      >
                        {fmt(item.unitPrice)} ea
                      </p>
                      <p
                        className={cn(
                          "text-[13px] font-bold tabular-nums",
                          darkMode ? "text-slate-100" : "text-gray-900",
                        )}
                      >
                        {fmt(item.lineTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div
        className={cn(
          "shrink-0 space-y-2.5 border-t px-4 py-3.5",
          darkMode
            ? "border-slate-700 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800"
            : "border-primary-100/80 bg-gradient-to-br from-primary-50/90 via-sky-50/40 to-primary-50/70",
        )}
      >
        <Row label="Subtotal" value={fmt(subtotal)} darkMode={darkMode} />

        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-[12px] font-semibold",
              darkMode ? "text-slate-400" : "text-gray-500",
            )}
          >
            Discount
          </span>
          <div className="flex items-center gap-1.5">
            <CustomSelect
              value={discountMode}
              onChange={(e) => setDiscountMode(e.target.value as DiscountMode)}
              options={[
                { value: "flat", label: "Flat $" },
                { value: "percent", label: "Percent %" },
              ]}
              className={cn(
                "!h-7 !rounded-lg !py-0.5 !pr-7 !text-[11px] !font-bold",
                darkMode ? darkField : "!border-primary-100",
              )}
              containerClassName="w-[100px]"
            />
            <CustomInput
              type="number"
              min={0}
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              placeholder="0"
              className={cn(
                "!h-7 !rounded-lg !px-2 !py-0.5 !text-right !text-[12px] !font-bold",
                darkMode ? darkField : "!border-primary-100",
              )}
              containerClassName="w-16"
            />
            <span className="min-w-[52px] text-right text-[12px] font-bold tabular-nums text-rose-500">
              −{fmt(discountAmount)}
            </span>
          </div>
        </div>

        <Row
          label={`Tax (${Math.round(taxRate * 100)}%)`}
          value={fmt(taxAmount)}
          darkMode={darkMode}
        />

        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-[12px] font-semibold",
              darkMode ? "text-slate-400" : "text-gray-500",
            )}
          >
            Shipping
          </span>
          <CustomInput
            type="number"
            min={0}
            step="0.01"
            value={shipping || ""}
            onChange={(e) => setShipping(Number(e.target.value) || 0)}
            placeholder="0.00"
            className={cn(
              "!h-7 !rounded-lg !px-2 !py-0.5 !text-right !text-[12px] !font-bold",
              darkMode ? darkField : "!border-primary-100",
            )}
            containerClassName="w-24"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-[12px] font-semibold",
              darkMode ? "text-slate-400" : "text-gray-500",
            )}
          >
            Order Note
          </span>
          <CustomInput
            value={note}
            onChange={(e) => setNote?.(e.target.value)}
            placeholder="Add instructions..."
            className={cn(
              "!h-7 !rounded-lg !px-2 !py-0.5 !text-right !text-[11px] font-medium",
              darkMode ? darkField : "!border-primary-100",
            )}
            containerClassName="w-36"
          />
        </div>

        <div
          className={cn(
            "flex items-end justify-between border-t pt-2",
            darkMode ? "border-slate-700" : "border-primary-200/50",
          )}
        >
          <span
            className={cn(
              "text-[13px] font-bold",
              darkMode ? "text-slate-300" : "text-gray-700",
            )}
          >
            Total Amount
          </span>
          <motion.span
            key={total}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            className="text-[26px] font-black leading-none tracking-tight tabular-nums text-primary-600"
          >
            {fmt(total)}
          </motion.span>
        </div>

        {/* Action Buttons inside Cart Panel */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <CustomButton
            type="button"
            variant="outline"
            size="lg"
            onClick={onHold}
            disabled={cart.length === 0}
            leftIcon={<PauseCircle size={16} />}
            className={cn(
              "!h-11 !rounded-2xl !border-2 !border-primary-500 !px-4 !text-[13px] !font-extrabold !text-primary-600",
              darkMode
                ? "!bg-slate-900 hover:!bg-slate-800 !text-primary-400"
                : "!bg-white hover:!bg-primary-50",
            )}
          >
            Hold
          </CustomButton>

          <CustomButton
            type="button"
            size="lg"
            disabled={cart.length === 0 || submitting}
            loading={submitting}
            onClick={onProceed}
            className="!h-11 !rounded-2xl !px-4 !text-[13px] !font-extrabold shadow-lg shadow-primary-600/30"
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
