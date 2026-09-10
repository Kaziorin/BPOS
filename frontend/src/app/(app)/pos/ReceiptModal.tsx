"use client";

import { CheckCircle2, Printer, RotateCcw } from "lucide-react";
import type { SaleResult } from "./pos-types";
import { siteConfig } from "@/config/site";

interface CartItem {
  id?: string;
  sku?: string;
  productId?: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

interface PaymentInfo {
  method: string;
  amount: number;
}

interface Props {
  result: SaleResult;
  cart?: CartItem[];
  payments?: PaymentInfo[];
  cashierName?: string;
  customerName?: string;
  onNewSale: () => void;
}

export function ReceiptModal({ result, cart, payments, cashierName, customerName, onNewSale }: Props) {
  const currentDate = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Financial calculations
  const subtotal = cart && cart.length > 0
    ? cart.reduce((sum, item) => sum + item.lineTotal, 0)
    : result.total;

  const rawVat = result.total > subtotal ? result.total - subtotal : subtotal * 0.05;
  const vatAmount = Math.max(0, rawVat);
  const vatRatePct = subtotal > 0 && vatAmount > 0 ? Math.round((vatAmount / subtotal) * 100) : 5;
  const netPayable = result.total;

  // Primary payment method text
  const primaryMethod = payments && payments.length > 0 ? payments[0].method.toUpperCase() : "CASH";
  const tenderText = `${primaryMethod} (Paid: ৳${result.paidTotal.toFixed(2)})`;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-4 w-full max-w-[400px] mx-auto">
      {/* Success Badge */}
      <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
        <CheckCircle2 size={16} />
        <span className="text-xs font-bold uppercase tracking-wider">Sale Completed Successfully</span>
      </div>

      {/* 80mm Thermal Receipt Container */}
      <div
        id="thermal-receipt"
        className="w-full rounded-2xl border border-gray-300 bg-white p-6 shadow-lg font-mono text-xs text-gray-800 space-y-3"
      >
        {/* Header */}
        <div className="text-center">
          <h2 className="text-base font-extrabold tracking-wider text-gray-950 uppercase">{siteConfig.name || "BLUE OCEANS POS"}</h2>
          <p className="text-[11px] text-gray-500 mt-1">Dhaka Flagship Outlet • Counter #POS-01</p>
          <p className="text-[10px] text-gray-500 mt-0.5">BIN / VAT Reg No: 002938194-0101 • Mushak-6.3</p>
        </div>

        <div className="border-t border-dashed border-gray-300" />

        {/* Meta Info */}
        <div className="space-y-1 text-[11px] text-gray-600">
          <div className="flex justify-between items-baseline gap-2">
            <div className="truncate">
              <span className="text-gray-400">Invoice: </span>
              <span className="font-bold text-gray-900">{result.invoiceNo}</span>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-gray-400">Date: </span>
              <span className="text-gray-800">{currentDate}</span>
            </div>
          </div>
          <div className="flex justify-between items-baseline gap-2">
            <div className="truncate">
              <span className="text-gray-400">Customer: </span>
              <span className="text-gray-800 font-medium">{customerName || "Walk-in Retail Customer"}</span>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-gray-400">Cashier: </span>
              <span className="text-gray-800 font-medium">{cashierName || "Admin"}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-300" />

        {/* Items List */}
        {cart && cart.length > 0 && (
          <div>
            <div className="grid grid-cols-12 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">
              <span className="col-span-5">ITEM / SKU</span>
              <span className="col-span-1 text-center">QTY</span>
              <span className="col-span-3 text-right">RATE</span>
              <span className="col-span-3 text-right">TOTAL</span>
            </div>

            <div className="space-y-2.5">
              {cart.map((item, idx) => {
                const skuCode = item.sku || (item.productId ? `PRD-${item.productId.slice(-6).toUpperCase()}` : `PRD-${823790 + idx}`);
                return (
                  <div key={idx} className="grid grid-cols-12 items-baseline text-xs leading-tight">
                    <div className="col-span-5 pr-1">
                      <div className="font-bold text-gray-900 leading-tight">{item.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">SKU: {skuCode}</div>
                    </div>
                    <div className="col-span-1 text-center text-gray-700 font-mono">{item.qty}</div>
                    <div className="col-span-3 text-right text-gray-700 font-mono">৳{item.unitPrice.toFixed(2)}</div>
                    <div className="col-span-3 text-right font-bold text-gray-900 font-mono">৳{item.lineTotal.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-t border-dashed border-gray-300" />

        {/* Financial Breakdown */}
        <div className="space-y-1.5 text-xs text-gray-700">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal:</span>
            <span className="font-mono text-gray-900">৳{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>VAT (Mushak 6.3 - {vatRatePct}%):</span>
            <span className="font-mono">৳{vatAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between font-bold text-sm text-gray-950 border-t border-b border-gray-300 py-1.5 my-1">
            <span>Net Payable:</span>
            <span className="font-mono text-base">৳{netPayable.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-baseline gap-2">
            <span className="text-gray-500 shrink-0">Tender Method:</span>
            <span className="font-bold text-gray-900 text-right font-mono">{tenderText}</span>
          </div>

          {result.dueTotal > 0 && (
            <div className="flex justify-between font-bold text-amber-700">
              <span>Remaining Due:</span>
              <span className="font-mono">৳{result.dueTotal.toFixed(2)}</span>
            </div>
          )}

          {result.paidTotal > result.total && (
            <div className="flex justify-between font-bold text-emerald-700">
              <span>Change Return:</span>
              <span className="font-mono">৳{(result.paidTotal - result.total).toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-gray-300" />

        {/* Barcode & Policy Footer */}
        <div className="text-center space-y-1">
          <div className="flex justify-center py-1">
            <div className="flex items-center gap-[2px] h-8 px-3 bg-gray-50 rounded">
              <div className="w-0.5 h-7 bg-black" />
              <div className="w-1.5 h-7 bg-black" />
              <div className="w-0.5 h-7 bg-black" />
              <div className="w-2 h-7 bg-black" />
              <div className="w-0.5 h-7 bg-black" />
              <div className="w-1 h-7 bg-black" />
              <div className="w-0.5 h-7 bg-black" />
              <div className="w-1.5 h-7 bg-black" />
              <div className="w-0.5 h-7 bg-black" />
              <div className="w-2 h-7 bg-black" />
              <div className="w-0.5 h-7 bg-black" />
              <div className="w-1 h-7 bg-black" />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-mono">*{result.invoiceNo}*</p>
          <p className="text-xs font-bold text-gray-700 text-center max-w-[260px] mx-auto mt-2 leading-tight">
            Items can be exchanged within 7 days with original receipt.
          </p>
          <p className="text-[10px] text-gray-400 text-center font-mono mt-2">
            Software by Blue Oceans OmniPOS Cloud • Spec §33
          </p>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="flex w-full gap-2.5 mt-1">
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
