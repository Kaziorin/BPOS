"use client";

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
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
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
          <title>Receipt_${data.invoiceNo}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            *, *:before, *:after {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              width: 80mm;
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              color: #000;
              background: #fff;
              padding: 4mm 3mm;
              line-height: 1.3;
            }
            .border-dashed { border-style: dashed; }
            .border-t { border-top: 1px solid #d1d5db; }
            .border-b { border-bottom: 1px solid #d1d5db; }
            .border-gray-200 { border-color: #e5e7eb; }
            .border-gray-300 { border-color: #d1d5db; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            .font-medium { font-weight: 500; }
            .font-extrabold { font-weight: 800; }
            .uppercase { text-transform: uppercase; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .items-baseline { align-items: baseline; }
            .items-center { align-items: center; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-1\\.5 > * + * { margin-top: 6px; }
            .space-y-2\\.5 > * + * { margin-top: 10px; }
            .space-y-3 > * + * { margin-top: 12px; }
            .grid { display: grid; }
            .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
            .col-span-5 { grid-column: span 5 / span 5; }
            .col-span-1 { grid-column: span 1 / span 1; }
            .col-span-3 { grid-column: span 3 / span 3; }
            .my-1 { margin-top: 4px; margin-bottom: 4px; }
            .py-1 { padding-top: 4px; padding-bottom: 4px; }
            .py-1\\.5 { padding-top: 6px; padding-bottom: 6px; }
            .pb-1 { padding-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .mt-0\\.5 { margin-top: 2px; }
            .mt-1 { margin-top: 4px; }
            .mt-2 { margin-top: 8px; }
            .p-6 { padding: 4px 0; }
            .px-3 { padding-left: 12px; padding-right: 12px; }
            .text-xs { font-size: 11px; }
            .text-sm { font-size: 12px; }
            .text-base { font-size: 14px; }
            .text-\\[10px\\] { font-size: 10px; }
            .text-\\[11px\\] { font-size: 11px; }
            .text-gray-400 { color: #666; }
            .text-gray-500 { color: #444; }
            .text-gray-600 { color: #111; }
            .text-emerald-600 { color: #059669; }
            .text-emerald-700 { color: #047857; }
            .text-amber-700 { color: #b45309; }
            .font-mono { font-family: 'Courier New', Courier, monospace; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .shrink-0 { flex-shrink: 0; }
            .gap-2 { gap: 8px; }
            .leading-tight { line-height: 1.2; }
            .bg-gray-50 { background-color: #f9fafb; }
            .rounded-sm { border-radius: 2px; }
            .h-7 { height: 28px; }
            .h-8 { height: 32px; }
            .w-0\\.5 { width: 2px; }
            .w-1 { width: 4px; }
            .w-1\\.5 { width: 6px; }
            .w-2 { width: 8px; }
            .bg-black { background-color: #000; }
            .gap-\\[2px\\] { gap: 2px; }
          </style>
        </head>
        <body>
          ${printEl.innerHTML}
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
        className="w-full max-w-[440px] my-auto"
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
            className="w-full rounded-sm border border-slate-200 bg-white p-6 shadow-2xs font-mono text-xs text-gray-600 space-y-3"
          >
            {/* Header */}
            <div className="text-center">
              <h2 className="text-base font-extrabold tracking-wider text-gray-600 uppercase">
                {siteConfig.name || "BLUE OCEANS POS"}
              </h2>
              <p className="text-[11px] text-gray-500 mt-1">
                Dhaka Flagship Outlet • Counter #POS-01
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                BIN / VAT Reg No: 002938194-0101 • Mushak-6.3
              </p>
            </div>

            <div className="border-t border-dashed border-gray-300" />

            {/* Meta Info */}
            <div className="space-y-1 text-[11px] text-gray-600">
              <div className="flex justify-between items-baseline gap-2">
                <div className="truncate">
                  <span className="text-gray-400">Invoice: </span>
                  <span className="font-bold text-gray-600">{data.invoiceNo}</span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-gray-400">Date: </span>
                  <span className="text-gray-600">{invoiceDate}</span>
                </div>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <div className="truncate">
                  <span className="text-gray-400">Customer: </span>
                  <span className="text-gray-600 font-medium">
                    {data.customerName || "Walk-in Customer"}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-gray-400">Cashier: </span>
                  <span className="text-gray-600 font-medium">
                    {data.cashierName || "Admin"}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300" />

            {/* Items List */}
            {items.length > 0 && (
              <div>
                <div className="grid grid-cols-12 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">
                  <span className="col-span-5">ITEM / SKU</span>
                  <span className="col-span-1 text-center">QTY</span>
                  <span className="col-span-3 text-right">RATE</span>
                  <span className="col-span-3 text-right">TOTAL</span>
                </div>

                <div className="space-y-2.5">
                  {items.map((item, idx) => {
                    const skuCode =
                      item.sku ||
                      (item.productId
                        ? `PRD-${item.productId.slice(-6).toUpperCase()}`
                        : `PRD-${823790 + idx}`);
                    const lineTotal = Number(item.lineTotal || 0) || Number(item.unitPrice || 0) * Number(item.qty || 1);
                    return (
                      <div key={idx} className="grid grid-cols-12 items-baseline text-xs leading-tight">
                        <div className="col-span-5 pr-1">
                          <div className="font-bold text-gray-600 leading-tight">{item.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">SKU: {skuCode}</div>
                        </div>
                        <div className="col-span-1 text-center text-gray-600 font-mono">{item.qty}</div>
                        <div className="col-span-3 text-right text-gray-600 font-mono">
                          ৳{Number(item.unitPrice).toFixed(2)}
                        </div>
                        <div className="col-span-3 text-right font-bold text-gray-600 font-mono">
                          ৳{lineTotal.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border-t border-dashed border-gray-300" />

            {/* Financial Breakdown */}
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal:</span>
                <span className="font-mono text-gray-600">৳{subtotal.toFixed(2)}</span>
              </div>

              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-mono">-৳{discountTotal.toFixed(2)}</span>
                </div>
              )}

              {(vatAmount > 0 || (serviceCharge === 0 && discountTotal === 0)) && (
                <div className="flex justify-between text-gray-500">
                  <span>VAT (Mushak 6.3{vatRateLabel ? ` - ${vatRateLabel}` : ""}):</span>
                  <span className="font-mono">৳{vatAmount.toFixed(2)}</span>
                </div>
              )}

              {serviceCharge > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Service Charge{scRateLabel}:</span>
                  <span className="font-mono">৳{serviceCharge.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-sm text-gray-600 border-t border-b border-gray-300 py-1.5 my-1">
                <span>Net Payable:</span>
                <span className="font-mono text-base">৳{netPayable.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-baseline gap-2">
                <span className="text-gray-500 shrink-0">Tender Method:</span>
                <span className="font-bold text-gray-600 text-right font-mono">{primaryMethod}</span>
              </div>

              <div className="flex justify-between items-baseline gap-2">
                <span className="text-gray-500 shrink-0">Paid Amount:</span>
                <span className="font-bold text-gray-600 text-right font-mono">৳{paidTotal.toFixed(2)}</span>
              </div>

              {Number(data.dueTotal || 0) > 0 && (
                <div className="flex justify-between font-bold text-amber-700">
                  <span>Remaining Due:</span>
                  <span className="font-mono">৳{Number(data.dueTotal).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-emerald-700">
                <span>Return Amount:</span>
                <span className="font-mono">৳{changeReturn.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300" />

            {/* Barcode & Footer */}
            <div className="text-center space-y-1">
              <div className="flex justify-center py-1">
                <div className="flex items-center gap-[2px] h-8 px-3 bg-gray-50 rounded-sm">
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
              <p className="text-[10px] text-gray-400 font-mono">*{data.invoiceNo}*</p>
              <p className="text-xs font-bold text-gray-600 text-center max-w-[260px] mx-auto mt-2 leading-tight">
                Items can be exchanged within 7 days with original receipt.
              </p>
              <p className="text-[10px] text-gray-400 text-center font-mono mt-2">
                Software by Blue Oceans OmniPOS Cloud • Spec §33
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex w-full gap-2.5 mt-1">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-sm border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-gray-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              <Printer size={15} />
              Print Thermal (80mm)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-sm border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-600 shadow-2xs hover:bg-rose-600 hover:text-white transition cursor-pointer"
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
