"use client";

import { Minus, Plus, Trash2, Tag } from "lucide-react";
import { CustomInput } from "@/components/custom/CustomInput";
import type { CartItem } from "./pos-types";

interface Props {
  items: CartItem[];
  selfCheckout?: boolean;
  onQtyChange: (idx: number, qty: number) => void;
  onRemove: (idx: number) => void;
  onDiscountChange: (idx: number, discount: number) => void;
  onPriceOverride: (idx: number, price: number) => void;
}

export function CartPanel({ items, selfCheckout, onQtyChange, onRemove, onDiscountChange, onPriceOverride }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        Cart is empty — scan or tap a product
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-1 pr-1">
      {items.map((item, idx) => (
        <div key={idx} className="rounded-lg border border-gray-100 bg-white p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
              <p className="text-xs text-gray-400 tabular-nums">
                {item.unitPrice.toFixed(2)} × {item.qty}
                {item.discountAmount > 0 && (
                  <span className="ml-1 text-amber-500">−{item.discountAmount.toFixed(2)}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onQtyChange(idx, item.qty - 1)}
                className="h-6 w-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                <Minus size={11} />
              </button>
              <span className="w-6 text-center text-xs font-medium tabular-nums">{item.qty}</span>
              <button
                onClick={() => onQtyChange(idx, item.qty + 1)}
                className="h-6 w-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                <Plus size={11} />
              </button>
              <button onClick={() => onRemove(idx)} className="ml-1 text-gray-300 hover:text-red-500">
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {!selfCheckout && (
            <div className="mt-1.5 flex gap-2">
              <CustomInput
                containerClassName="flex-1"
                type="number"
                min={0}
                step="0.01"
                placeholder="Discount"
                value={item.discountAmount || ""}
                onChange={(e) => onDiscountChange(idx, Number(e.target.value))}
                leftIcon={<Tag size={11} />}
                className="py-1 text-xs"
              />
              <CustomInput
                containerClassName="flex-1"
                type="number"
                min={0}
                step="0.01"
                placeholder="Override price"
                value={item.unitPrice || ""}
                onChange={(e) => onPriceOverride(idx, Number(e.target.value))}
                className="py-1 text-xs"
              />
            </div>
          )}

          <p className="mt-1 text-right text-sm font-semibold text-gray-900 tabular-nums">
            {item.lineTotal.toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  );
}
