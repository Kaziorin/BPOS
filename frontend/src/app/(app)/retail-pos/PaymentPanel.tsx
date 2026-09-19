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
  { id: "CARD", label: "Card", icon: CreditCard, color: "text-brand-primary bg-brand-50 border-brand-border" },
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
            <CustomButton
              key={m.id}
              variant={isSelected ? "primary" : "secondary"}
              themeColor={isSelected ? "teal" : undefined}
              size="xs"
              onClick={() => setSingleMethod(m.id)}
              className={cn(
                "flex-col items-center justify-center p-1.5 rounded-sm border text-center h-auto",
                !isSelected && "bg-brand-50 text-gray-600 border-brand-border hover:bg-brand-50"
              )}
            >
              <Icon size={14} className={isSelected ? "text-white" : "text-brand-primary"} />
              <span className="text-[11px] mt-0.5">{m.label}</span>
            </CustomButton>
          );
        })}
      </div>

      {/* Quick Cash Tender Presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        <CustomButton
          variant="outline"
          size="xs"
          onClick={setCashExact}
          className="rounded-sm bg-emerald-50 border-emerald-300 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
        >
          Exact ৳{total.toFixed(0)}
        </CustomButton>
        {QUICK_AMOUNTS.map((amt) => (
          <CustomButton
            key={amt}
            variant="outline"
            size="xs"
            onClick={() => addCashAmount(amt)}
            className="rounded-sm bg-brand-50 border-brand-border text-xs font-semibold text-gray-600 hover:bg-brand-50 tabular-nums"
          >
            ৳{amt}
          </CustomButton>
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
              <CustomButton
                variant="ghost"
                size="xs"
                onClick={() => removeLine(idx)}
                className="h-8 w-8 !p-0 text-gray-400 hover:text-red-500 rounded-sm flex items-center justify-center shrink-0"
                title="Remove line"
              >
                <Trash2 size={14} />
              </CustomButton>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <CustomButton
          variant="ghost"
          size="xs"
          onClick={() => addLine("CASH", remaining)}
          className="gap-1 text-xs font-medium text-brand-dark hover:text-brand-dark p-0 h-auto"
        >
          <Plus size={12} /> Split with another method
        </CustomButton>
      </div>

      {/* Totals Summary */}
      <div className="rounded-sm border border-slate-200 bg-brand-50 p-3 space-y-1.5 text-xs">
        <div className="flex justify-between text-gray-600 font-medium">
          <span>Net Payable:</span>
          <span className="tabular-nums font-bold text-gray-600 text-sm">৳{total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tendered / Paid:</span>
          <span className="tabular-nums font-semibold text-gray-600">৳{paid.toFixed(2)}</span>
        </div>
        {remaining > 0 && (
          <div className="flex justify-between font-bold text-amber-700 bg-amber-50/80 p-1.5 rounded-sm border border-amber-200">
            <span>Remaining Due:</span>
            <span className="tabular-nums">৳{remaining.toFixed(2)}</span>
          </div>
        )}
        {change > 0 && (
          <div className="flex justify-between font-bold text-emerald-700 bg-emerald-50/80 p-1.5 rounded-sm border border-emerald-200">
            <span>Change Return:</span>
            <span className="tabular-nums text-sm">৳{change.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

