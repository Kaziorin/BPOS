"use client";

import { useState } from "react";
import { Plus, Trash2, Banknote, Smartphone, CreditCard, Clock, Wallet } from "lucide-react";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { PAYMENT_METHODS, type PaymentLine } from "./pos-types";
import { cn } from "@/lib/cn";

interface Props {
  total: number;
  payments: PaymentLine[];
  onChange: (payments: PaymentLine[]) => void;
}

const QUICK_AMOUNTS = [50, 100, 500, 1000, 2000];

const METHOD_PRESETS = [
  { id: "CASH", label: "Cash", icon: Banknote, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "BKASH", label: "bKash", icon: Smartphone, color: "text-pink-600 bg-pink-50 border-pink-200" },
  { id: "NAGAD", label: "Nagad", icon: Smartphone, color: "text-orange-600 bg-orange-50 border-orange-200" },
  { id: "CARD", label: "Card", icon: CreditCard, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "CREDIT", label: "Due", icon: Clock, color: "text-purple-600 bg-purple-50 border-purple-200" },
];

export function PaymentPanel({ total, payments, onChange }: Props) {
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(total - paid, 0);
  const change = Math.max(paid - total, 0);

  function addLine(method = "CASH", amount = remaining) {
    onChange([...payments, { method, amount }]);
  }

  function setSingleMethod(method: string) {
    onChange([{ method, amount: total }]);
  }

  function updateLine(idx: number, field: keyof PaymentLine, value: string | number) {
    const next = payments.map((p, i) => (i === idx ? { ...p, [field]: field === "amount" ? Number(value) : value } : p));
    onChange(next);
  }

  function removeLine(idx: number) {
    onChange(payments.filter((_, i) => i !== idx));
  }

  function setCashExact() {
    if (payments.length === 1 && payments[0].method === "CASH") {
      updateLine(0, "amount", total);
    } else {
      onChange([{ method: "CASH", amount: total }]);
    }
  }

  function addCashAmount(val: number) {
    if (payments.length === 1 && payments[0].method === "CASH") {
      updateLine(0, "amount", val);
    } else {
      onChange([{ method: "CASH", amount: val }]);
    }
  }

  return (
    <div className="space-y-3">
      {/* Quick Method Buttons */}
      <div className="grid grid-cols-5 gap-1.5">
        {METHOD_PRESETS.map((m) => {
          const isSelected = payments.length === 1 && payments[0].method === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSingleMethod(m.id)}
              className={cn(
                "flex flex-col items-center justify-center p-1.5 rounded-xl border text-center transition text-xs font-semibold",
                isSelected
                  ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              )}
            >
              <Icon size={14} className={isSelected ? "text-white" : "text-gray-500"} />
              <span className="text-[11px] mt-0.5">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Cash Tender Presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={setCashExact}
          className="rounded-lg bg-emerald-100/70 border border-emerald-300 px-2 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-200 transition"
        >
          Exact ৳{total.toFixed(0)}
        </button>
        {QUICK_AMOUNTS.map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => addCashAmount(amt)}
            className="rounded-lg bg-gray-100 border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition tabular-nums"
          >
            ৳{amt}
          </button>
        ))}
      </div>

      {/* Payment Lines */}
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
              containerClassName="w-32"
              type="number"
              min={0}
              step="0.01"
              value={p.amount}
              onChange={(e) => updateLine(idx, "amount", e.target.value)}
              leftIcon={<span className="text-xs font-semibold text-gray-400">৳</span>}
            />
            {payments.length > 1 && (
              <button onClick={() => removeLine(idx)} className="text-gray-300 hover:text-red-500 shrink-0 p-1">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => addLine("CASH", remaining)}
          className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
        >
          <Plus size={12} /> Split with another method
        </button>
      </div>

      {/* Totals Summary */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 space-y-1.5 text-xs">
        <div className="flex justify-between text-gray-600 font-medium">
          <span>Net Payable:</span>
          <span className="tabular-nums font-bold text-gray-900 text-sm">৳{total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tendered / Paid:</span>
          <span className="tabular-nums font-semibold text-gray-800">৳{paid.toFixed(2)}</span>
        </div>
        {remaining > 0 && (
          <div className="flex justify-between font-bold text-amber-700 bg-amber-50/80 p-1.5 rounded-lg border border-amber-200">
            <span>Remaining Due:</span>
            <span className="tabular-nums">৳{remaining.toFixed(2)}</span>
          </div>
        )}
        {change > 0 && (
          <div className="flex justify-between font-bold text-emerald-700 bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-200">
            <span>Change Return:</span>
            <span className="tabular-nums text-sm">৳{change.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

