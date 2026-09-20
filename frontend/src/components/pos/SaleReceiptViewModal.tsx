"use client";

import React from "react";
import { CheckCircle2, Printer, X } from "lucide-react";
import { siteConfig } from "@/config/site";

export interface ReceiptViewItem {
  id?: string;
  sku?: string;
  productId?: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ReceiptViewPayment {
  method: string;
  amount: number;
}

export interface ReceiptViewData {
  invoiceNo: string;
  createdAt?: string;
  saleDate?: string;
  customerName?: string;
  cashierName?: string;
  items: ReceiptViewItem[];
  subtotal?: number;
  discountTotal?: number;
  taxTotal?: number;
  taxRatePct?: number;
  serviceCharge?: number;
  total: number;
  paidTotal: number;
  dueTotal: number;
  changeReturn?: number;
  change?: number;
  changeAmount?: number;
  returnAmount?: number;
  paymentMethod?: string;
  payments?: ReceiptViewPayment[];
}

interface Props {
  open: boolean;
  data: ReceiptViewData | null;
  onClose: () => void;
}

function BarcodeVector({ code }: { code: string }) {
  const bars: { x: number; w: number }[] = [];
  let curX = 6;

  // Start guard bars
  bars.push({ x: curX, w: 2 }); curX += 4;
  bars.push({ x: curX, w: 1 }); curX += 3;
  bars.push({ x: curX, w: 3 }); curX += 5;

  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i);
    const w1 = (c % 3) + 1;
    const w2 = ((c >> 1) % 3) + 1;
    const gap = ((c >> 2) % 2) + 2;
    bars.push({ x: curX, w: w1 });
    curX += w1 + gap;
    bars.push({ x: curX, w: w2 });
    curX += w2 + gap;
  }

  // Stop guard bars
  bars.push({ x: curX, w: 2 }); curX += 4;
  bars.push({ x: curX, w: 3 }); curX += 5;
  bars.push({ x: curX, w: 1 }); curX += 4;
  bars.push({ x: curX, w: 2 }); curX += 6;

  const totalWidth = curX + 6;

  return (
    <div className="flex justify-center py-1">
      <svg
        className="h-8 max-w-[210px] w-full"
        viewBox={`0 0 ${totalWidth} 34`}
        preserveAspectRatio="none"
      >
        {bars.map((b, idx) => (
          <rect key={idx} x={b.x} y="0" width={b.w} height="34" fill="#000000" />
        ))}
      </svg>
    </div>
  );
}

export function SaleReceiptViewModal({ open, data, onClose }: Props) {
  if (!open || !data) return null;

  const invoiceDate = data.createdAt || data.saleDate
    ? new Date(data.createdAt || data.saleDate!).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

  const items = data.items || [];

  const computedItemsSubtotal =
    items.length > 0
      ? items.reduce((sum, item) => sum + Number(item.lineTotal || (Number(item.unitPrice || 0) * Number(item.qty || 1))), 0)
      : Number(data.total || 0);

  const subtotal =
    data.subtotal !== undefined && Number(data.subtotal) > 0
      ? Number(data.subtotal)
      : computedItemsSubtotal;

  const discountTotal = Number(data.discountTotal || 0);

  const hasTaxProp = data.taxTotal !== undefined && data.taxTotal !== null;
  const hasServiceProp = data.serviceCharge !== undefined && data.serviceCharge !== null;

  let vatAmount = 0;
  let serviceCharge = 0;

  if (hasTaxProp || hasServiceProp) {
    vatAmount = Math.max(0, Number(data.taxTotal || 0));
    serviceCharge = Math.max(0, Number(data.serviceCharge || 0));
  } else {
    const rawDiff = Math.max(0, data.total - Math.max(0, subtotal - discountTotal));
    vatAmount = rawDiff;
    serviceCharge = 0;
  }

  const baseForRate = Math.max(1, subtotal - discountTotal);

  let vatRatePct: number;
  if (data.taxRatePct !== undefined) {
    vatRatePct = data.taxRatePct;
  } else if (vatAmount > 0) {
    vatRatePct = Number(((vatAmount / baseForRate) * 100).toFixed(1));
  } else {
    vatRatePct = 0;
  }
  const vatRateLabel = vatRatePct > 0 ? `${vatRatePct % 1 === 0 ? Math.round(vatRatePct) : vatRatePct}%` : "";

  const scRatePct = serviceCharge > 0 ? Number(((serviceCharge / baseForRate) * 100).toFixed(1)) : 0;
  const scRateLabel = scRatePct > 0 ? ` (${scRatePct % 1 === 0 ? Math.round(scRatePct) : scRatePct}%)` : "";

  const netPayable = data.total ?? 0;

  const primaryMethod =
    data.payments && data.payments.length > 0
      ? data.payments[0].method.toUpperCase()
      : (data.paymentMethod || "CASH").toUpperCase();

  const paidTotal = Number(data.paidTotal ?? data.total ?? 0);
  const changeReturn = Math.max(
    0,
    Number(
      data.changeReturn ??
      data.change ??
      data.changeAmount ??
      data.returnAmount ??
      (paidTotal > data.total ? paidTotal - data.total : 0)
    )
  );

  const handlePrint = () => {
    const printEl = document.getElementById("thermal-receipt");
    if (!printEl) {
      window.print();
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "80mm";
    iframe.style.height = "100px";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt_${data.invoiceNo}</title>
          <style>
            @page {
              size: auto;
              margin: 4mm auto;
            }
            *, *:before, *:after {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            html, body {
              width: 100%;
              margin: 0;
              padding: 0;
              background: #fff;
              display: flex;
              justify-content: center;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #000;
              -webkit-font-smoothing: antialiased;
            }
            .receipt-wrap {
              width: 76mm;
              max-width: 76mm;
              margin: 0 auto;
              padding: 2mm 1mm;
              background: #fff;
            }
            .font-mono {
              font-family: 'SF Mono', 'Roboto Mono', 'Courier New', Courier, monospace !important;
            }
            .border-dashed {
              border-style: dashed !important;
            }
            .border-t {
              border-top: 1px dashed #444 !important;
            }
            .border-b {
              border-bottom: 1px dashed #444 !important;
            }
            .border-t-2 {
              border-top: 2px solid #000 !important;
            }
            .border-b-2 {
              border-bottom: 2px solid #000 !important;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .font-extrabold, .font-black { font-weight: 800; }
            .uppercase { text-transform: uppercase; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .items-baseline { align-items: baseline; }
            .items-center { align-items: center; }
            .space-y-0\\.5 > * + * { margin-top: 2px; }
            .space-y-1 > * + * { margin-top: 3px; }
            .space-y-1\\.5 > * + * { margin-top: 5px; }
            .space-y-2 > * + * { margin-top: 7px; }
            .space-y-2\\.5 > * + * { margin-top: 9px; }
            .space-y-3 > * + * { margin-top: 11px; }
            .grid { display: grid; }
            .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
            .col-span-6 { grid-column: span 6 / span 6; }
            .col-span-1 { grid-column: span 1 / span 1; }
            .col-span-2 { grid-column: span 2 / span 2; }
            .col-span-3 { grid-column: span 3 / span 3; }
            .col-span-5 { grid-column: span 5 / span 5; }
            .my-1 { margin-top: 4px; margin-bottom: 4px; }
            .my-1\\.5 { margin-top: 6px; margin-bottom: 6px; }
            .my-2 { margin-top: 8px; margin-bottom: 8px; }
            .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
            .py-1 { padding-top: 4px; padding-bottom: 4px; }
            .py-1\\.5 { padding-top: 6px; padding-bottom: 6px; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .py-2\\.5 { padding-top: 10px; padding-bottom: 10px; }
            .pb-1 { padding-bottom: 4px; }
            .pb-1\\.5 { padding-bottom: 6px; }
            .pb-2 { padding-bottom: 8px; }
            .pb-2\\.5 { padding-bottom: 10px; }
            .pt-0\\.5 { padding-top: 2px; }
            .pt-1 { padding-top: 4px; }
            .mb-1\\.5 { margin-bottom: 6px; }
            .mb-2 { margin-bottom: 8px; }
            .mt-0\\.5 { margin-top: 2px; }
            .mt-1 { margin-top: 4px; }
            .mt-2 { margin-top: 8px; }
            .pr-1 { padding-right: 4px; }
            .text-xs { font-size: 11.5px; }
            .text-sm { font-size: 13px; }
            .text-base { font-size: 15px; }
            .text-\\[9px\\] { font-size: 9px; }
            .text-\\[10px\\] { font-size: 10px; }
            .text-\\[11px\\] { font-size: 11px; }
            .tracking-tight { letter-spacing: -0.02em; }
            .tracking-wider { letter-spacing: 0.05em; }
            .break-words { word-break: break-word; }
            .leading-tight { line-height: 1.25; }
            .text-gray-400 { color: #555; }
            .text-gray-500 { color: #444; }
            .text-gray-600 { color: #333; }
            .text-gray-700 { color: #222; }
            .text-gray-800, .text-gray-900 { color: #000; }
            .text-black { color: #000; }
            .text-emerald-700, .text-emerald-800, .text-emerald-900 { color: #047857; }
            .text-amber-800, .text-amber-900 { color: #92400e; }
            svg { display: block; }
            rect { fill: #000000 !important; }
          </style>
        </head>
        <body>
          <div class="receipt-wrap">
            ${printEl.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (e) {
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 250);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-4 py-4 w-full">
          {/* Success Badge */}
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <CheckCircle2 size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Sale Completed Successfully</span>
          </div>

          {/* 80mm Thermal Receipt */}
          <div
            id="thermal-receipt"
            className="w-full rounded-sm border border-slate-200 bg-white p-6 shadow-md text-xs text-gray-800 space-y-3 font-sans"
          >
            {/* Header */}
            <div className="text-center space-y-0.5">
              <h2 className="text-base font-extrabold tracking-wider text-black uppercase">
                {siteConfig.name || "BLUE OCEANS POS"}
              </h2>
              <p className="text-[11px] text-gray-700 font-medium">
                Dhaka Flagship Outlet • Counter #POS-01
              </p>
              <p className="text-[10px] text-gray-600">
                BIN / VAT Reg No: 002938194-0101 • Mushak-6.3
              </p>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Meta Info */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-500 font-medium">Invoice No:</span>
                <span className="font-bold text-black font-mono tracking-tight">{data.invoiceNo}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-gray-500 font-medium">Date & Time:</span>
                <span className="text-gray-900 font-mono text-[11px]">{invoiceDate}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-gray-500 font-medium">Customer:</span>
                <span className="font-semibold text-black text-right max-w-[210px] break-words">
                  {data.customerName || "Walk-in Customer"}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-gray-500 font-medium">Cashier / Staff:</span>
                <span className="font-semibold text-black text-right max-w-[210px] break-words">
                  {data.cashierName || "Admin"}
                </span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Items List */}
            {items.length > 0 && (
              <div>
                <div className="grid grid-cols-12 text-[10px] font-bold text-gray-800 uppercase tracking-wider border-b border-dashed border-gray-400 pb-1 mb-1.5">
                  <span className="col-span-6">ITEM / SKU</span>
                  <span className="col-span-1 text-center">QTY</span>
                  <span className="col-span-2 text-right">RATE</span>
                  <span className="col-span-3 text-right">TOTAL</span>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const skuCode =
                      item.sku ||
                      (item.productId
                        ? `PRD-${item.productId.slice(-6).toUpperCase()}`
                        : `PRD-${823790 + idx}`);
                    const lineTotal = Number(item.lineTotal || 0) || Number(item.unitPrice || 0) * Number(item.qty || 1);
                    return (
                      <div key={idx} className="grid grid-cols-12 items-baseline text-xs leading-tight py-0.5">
                        <div className="col-span-6 pr-1">
                          <div className="font-bold text-black leading-tight">{item.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">SKU: {skuCode}</div>
                        </div>
                        <div className="col-span-1 text-center font-bold text-black font-mono">{item.qty}</div>
                        <div className="col-span-2 text-right text-gray-800 font-mono">
                          ৳{Number(item.unitPrice).toFixed(2)}
                        </div>
                        <div className="col-span-3 text-right font-bold text-black font-mono">
                          ৳{lineTotal.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Financial Breakdown */}
            <div className="space-y-1.5 text-xs py-1">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-mono font-bold text-black">৳{subtotal.toFixed(2)}</span>
              </div>

              {discountTotal > 0 && (
                <div className="flex justify-between items-baseline text-emerald-800 font-medium">
                  <span>Discount:</span>
                  <span className="font-mono">-৳{discountTotal.toFixed(2)}</span>
                </div>
              )}

              {(vatAmount > 0 || (serviceCharge === 0 && discountTotal === 0)) && (
                <div className="flex justify-between items-baseline text-gray-700">
                  <span>VAT (Mushak 6.3{vatRateLabel ? ` - ${vatRateLabel}` : ""}):</span>
                  <span className="font-mono text-black">৳{vatAmount.toFixed(2)}</span>
                </div>
              )}

              {serviceCharge > 0 && (
                <div className="flex justify-between items-baseline text-gray-700">
                  <span>Service Charge{scRateLabel}:</span>
                  <span className="font-mono text-black">৳{serviceCharge.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline font-black text-sm text-black border-t-2 border-b-2 border-black py-1.5 my-2">
                <span className="uppercase tracking-wider">NET PAYABLE:</span>
                <span className="font-mono text-base tracking-tight">৳{netPayable.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-baseline pt-0.5">
                <span className="text-gray-600">Tender Method:</span>
                <span className="font-bold text-black font-mono">{primaryMethod}</span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-gray-600">Paid Amount:</span>
                <span className="font-bold text-black font-mono">৳{paidTotal.toFixed(2)}</span>
              </div>

              {Number(data.dueTotal || 0) > 0 && (
                <div className="flex justify-between items-baseline font-bold text-amber-900">
                  <span>Remaining Due:</span>
                  <span className="font-mono">৳{Number(data.dueTotal).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline font-bold text-emerald-900">
                <span>Change / Return:</span>
                <span className="font-mono">৳{changeReturn.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Barcode & Footer */}
            <div className="text-center space-y-1 pt-1">
              <BarcodeVector code={data.invoiceNo} />
              <p className="text-[10px] text-gray-700 font-mono tracking-wider">*{data.invoiceNo}*</p>
              <p className="text-xs font-semibold text-gray-800 text-center max-w-[280px] mx-auto mt-2 leading-tight">
                Items can be exchanged within 7 days with original receipt.
              </p>
              <p className="text-[10px] text-gray-500 text-center mt-2">
                Software by Blue Oceans POS
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex w-full gap-2.5 mt-1">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-sm border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
            >
              <Printer size={15} />
              Print Thermal (80mm)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-sm border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-600 shadow-xs hover:bg-rose-600 hover:text-white transition cursor-pointer"
            >
              <X size={15} />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
