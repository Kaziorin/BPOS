"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { PAYMENT_METHODS, type PaymentLine } from "./pos-types";

interface Props {
  total: number;
  payments: PaymentLine[];
  onChange: (payments: PaymentLine[]) => void;
}

export function PaymentPanel({ total, payments, onChange }: Props) {
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(total - paid, 0);
  const change = Math.max(paid - total, 0);

  function addLine() {
    onChange([...payments, { method: "CASH", amount: remaining }]);
  }

  function updateLine(idx: number, field: keyof PaymentLine, value: string | number) {
    const next = payments.map((p, i) => (i === idx ? { ...p, [field]: field === "amount" ? Number(value) : value } : p));
    onChange(next);
  }

  function removeLine(idx: number) {
    onChange(payments.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      {payments.map((p, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <CustomSelect
            containerClassName="flex-1"
            value={p.method}
            onChange={(e) => updateLine(idx, "method", e.target.value)}
            options={PAYMENT_METHODS}
          />
          <CustomInput
            containerClassName="w-28"
            type="number"
            min={0}
            step="0.01"
            value={p.amount}
            onChange={(e) => updateLine(idx, "amount", e.target.value)}
          />
          {payments.length > 1 && (
            <button onClick={() => removeLine(idx)} className="text-gray-300 hover:text-red-500 shrink-0">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}

      <button
        onClick={addLine}
        className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
      >
        <Plus size={12} /> Split payment
      </button>

      <div className="space-y-1 border-t border-gray-100 pt-2 text-sm">
        <div className="flex justify-between text-gray-500">
          <span>Paid</span>
          <span className="tabular-nums">{paid.toFixed(2)}</span>
        </div>
        {remaining > 0 && (
          <div className="flex justify-between font-medium text-amber-600">
            <span>Remaining</span>
            <span className="tabular-nums">{remaining.toFixed(2)}</span>
          </div>
        )}
        {change > 0 && (
          <div className="flex justify-between font-medium text-emerald-600">
            <span>Change</span>
            <span className="tabular-nums">{change.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
