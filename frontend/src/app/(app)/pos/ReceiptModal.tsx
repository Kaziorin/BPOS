"use client";

import { CheckCircle2, Printer, RotateCcw, Store, Sparkles, Download } from "lucide-react";
import { CustomButton } from "@/components/custom/CustomButton";
import type { SaleResult } from "./pos-types";
import { siteConfig } from "@/config/site";

interface Props {
  result: SaleResult;
  onNewSale: () => void;
}

export function ReceiptModal({ result, onNewSale }: Props) {
  const currentDate = new Date().toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-4 max-w-sm mx-auto">
      {/* Success Badge */}
      <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
        <CheckCircle2 size={16} />
        <span className="text-xs font-bold uppercase tracking-wider">Sale Completed Successfully</span>
      </div>

      {/* 80mm Thermal Receipt Container */}
      <div
        id="thermal-receipt"
        className="w-full rounded-2xl border border-gray-300 bg-white p-5 shadow-lg font-mono text-xs text-gray-800 space-y-3"
      >
        {/* Receipt Header */}
        <div className="text-center border-b border-dashed border-gray-300 pb-3 space-y-1">
          <p className="text-base font-bold tracking-tight text-gray-950 uppercase">{siteConfig.name}</p>
          <p className="text-[11px] text-gray-500">Dhaka Main Branch • Terminal POS-01</p>
          <p className="text-[10px] text-gray-500">BIN / VAT Reg No: 002938194-0101</p>
          <p className="text-[10px] text-gray-400">Mushak-6.3 Tax Invoice</p>
        </div>

        {/* Meta Info */}
        <div className="space-y-1 text-[11px] text-gray-600 border-b border-dashed border-gray-300 pb-2">
          <div className="flex justify-between">
            <span>Invoice:</span>
            <span className="font-bold text-gray-900">{result.invoiceNo}</span>
          </div>
          <div className="flex justify-between">
            <span>Date & Time:</span>
            <span>{currentDate}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>Terminal Admin</span>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Gross Total:</span>
            <span className="font-medium tabular-nums">৳{result.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500 text-[11px]">
            <span>Included VAT (NBR):</span>
            <span className="tabular-nums">৳{(result.total * 0.05).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-gray-950 border-t border-b border-gray-200 py-1.5 my-1">
            <span>Net Payable:</span>
            <span className="tabular-nums">৳{result.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-700 font-medium">
            <span>Paid Amount:</span>
            <span className="tabular-nums font-semibold text-emerald-700">৳{result.paidTotal.toFixed(2)}</span>
          </div>
          {result.dueTotal > 0 && (
            <div className="flex justify-between text-amber-700 font-bold">
              <span>Remaining Due:</span>
              <span className="tabular-nums">৳{result.dueTotal.toFixed(2)}</span>
            </div>
          )}
          {result.paidTotal > result.total && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Change Return:</span>
              <span className="tabular-nums">৳{(result.paidTotal - result.total).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Barcode & Footer Message */}
        <div className="text-center border-t border-dashed border-gray-300 pt-3 space-y-1">
          <div className="flex justify-center py-1">
            {/* Clean CSS barcode representation */}
            <div className="flex items-center gap-0.5 h-7 px-2 bg-gray-100 rounded">
              <div className="w-0.5 h-6 bg-black" />
              <div className="w-1 h-6 bg-black" />
              <div className="w-0.5 h-6 bg-black" />
              <div className="w-1.5 h-6 bg-black" />
              <div className="w-0.5 h-6 bg-black" />
              <div className="w-1 h-6 bg-black" />
              <div className="w-0.5 h-6 bg-black" />
              <div className="w-1 h-6 bg-black" />
              <div className="w-1.5 h-6 bg-black" />
              <div className="w-0.5 h-6 bg-black" />
            </div>
          </div>
          <p className="text-[10px] text-gray-400">*{result.invoiceNo}*</p>
          <p className="text-[11px] font-semibold text-gray-700 mt-2">Thank you for your business!</p>
          <p className="text-[9px] text-gray-400">Software by Blue Oceans OmniPOS Cloud</p>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="flex w-full gap-2.5 mt-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition"
        >
          <Printer size={15} />
          Print Thermal (80mm)
        </button>
        <button
          type="button"
          onClick={onNewSale}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm shadow-primary-600/30 hover:bg-primary-700 transition"
        >
          <RotateCcw size={15} />
          New Sale (F1)
        </button>
      </div>
    </div>
  );
}

