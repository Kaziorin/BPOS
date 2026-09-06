"use client";

import { CheckCircle2, Printer, RotateCcw } from "lucide-react";
import { CustomButton } from "@/components/custom/CustomButton";
import type { SaleResult } from "./pos-types";

interface Props {
  result: SaleResult;
  onNewSale: () => void;
}

export function ReceiptModal({ result, onNewSale }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
        <CheckCircle2 size={36} />
      </div>

      <div className="text-center">
        <p className="text-xl font-bold text-gray-900">Sale Complete</p>
        <p className="mt-1 text-sm text-gray-500">Invoice {result.invoiceNo}</p>
      </div>

      <div className="w-full max-w-xs rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Total</span>
          <span className="font-bold tabular-nums">{result.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Paid</span>
          <span className="font-medium text-emerald-600 tabular-nums">{result.paidTotal.toFixed(2)}</span>
        </div>
        {result.dueTotal > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Due</span>
            <span className="font-medium text-amber-600 tabular-nums">{result.dueTotal.toFixed(2)}</span>
          </div>
        )}
        {result.paidTotal > result.total && (
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <span className="text-gray-500">Change</span>
            <span className="font-bold text-emerald-600 tabular-nums">
              {(result.paidTotal - result.total).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <CustomButton variant="outline" leftIcon={<Printer size={15} />} onClick={() => window.print()}>
          Print Receipt
        </CustomButton>
        <CustomButton leftIcon={<RotateCcw size={15} />} onClick={onNewSale}>
          New Sale
        </CustomButton>
      </div>
    </div>
  );
}
