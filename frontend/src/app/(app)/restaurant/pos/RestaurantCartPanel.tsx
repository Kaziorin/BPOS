"use client";

import { Minus, Plus, Trash2, Tag, CheckCircle2 } from "lucide-react";
import { CustomInput } from "@/components/custom/CustomInput";
import type { CartItem } from "../../pos/pos-types";

export interface KOTItem {
  id: string;
  productId: string;
  name: string;
  qty: number;
  modifiersJson?: string;
  notes?: string;
  status: string; // NEW, PREPARING, SERVED etc.
  unitPrice?: number; // Fetched from product if needed
}

interface Props {
  newItems: CartItem[];
  sentItems: KOTItem[];
  onQtyChange: (idx: number, qty: number) => void;
  onRemove: (idx: number) => void;
  onDiscountChange: (idx: number, discount: number) => void;
  onPriceOverride: (idx: number, price: number) => void;
}

export function RestaurantCartPanel({
  newItems,
  sentItems,
  onQtyChange,
  onRemove,
  onDiscountChange,
  onPriceOverride,
}: Props) {
  const hasItems = newItems.length > 0 || sentItems.length > 0;

  if (!hasItems) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        Cart is empty — Select a table and add items
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
      {/* SENT ITEMS (Read-Only) */}
      {sentItems.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Sent to Kitchen ({sentItems.length})
            </span>
          </div>
          {sentItems.map((item, idx) => (
            <div key={`sent-${idx}`} className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-2.5 opacity-80">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Qty: {item.qty}</p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NEW ITEMS (Editable) */}
      {newItems.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100 pt-2">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              New Items (Draft)
            </span>
          </div>
          {newItems.map((item, idx) => (
            <div key={`new-${idx}`} className="rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 shadow-sm">
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
                    className="h-6 w-6 flex items-center justify-center rounded border border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="w-6 text-center text-xs font-medium tabular-nums">{item.qty}</span>
                  <button
                    onClick={() => onQtyChange(idx, item.qty + 1)}
                    className="h-6 w-6 flex items-center justify-center rounded border border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    <Plus size={11} />
                  </button>
                  <button onClick={() => onRemove(idx)} className="ml-1 text-amber-300 hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

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

              <p className="mt-1 text-right text-sm font-semibold text-gray-900 tabular-nums">
                {item.lineTotal.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
