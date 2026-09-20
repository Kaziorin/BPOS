"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Printer, X, Sliders, Settings } from "lucide-react";
import { siteConfig } from "@/config/site";
import {
  getInvoiceSettings,
  saveInvoiceSettings,
  type InvoiceSettings,
} from "@/lib/invoiceSettings";

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
  vertical?: string;
  orderType?: string;
  tableNo?: string;
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
  const [settings, setSettings] = useState<InvoiceSettings>(getInvoiceSettings());
  const [showQuickSettings, setShowQuickSettings] = useState(false);

  useEffect(() => {
    setSettings(getInvoiceSettings());
    const onSettingsChange = (e: any) => {
      if (e?.detail) setSettings(e.detail);
    };
    window.addEventListener("invoice-settings-changed", onSettingsChange);
    return () => window.removeEventListener("invoice-settings-changed", onSettingsChange);
  }, []);

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

  // Determine if this receipt belongs to a Restaurant context
  const isRestaurant = Boolean(
    data.vertical === "restaurant" ||
    data.orderType === "DINE_IN" ||
    data.orderType === "TAKEAWAY" ||
    data.orderType === "DELIVERY" ||
    data.tableNo ||
    serviceCharge > 0 ||
    settings.businessType === "restaurant"
  );

  // Return policy: strictly do NOT render for restaurant or when disabled in settings!
  const showReturnPolicyText =
    !isRestaurant &&
    settings.showReturnPolicy &&
    Boolean(settings.returnPolicyText && settings.returnPolicyText.trim().length > 0);

  // Dynamic custom footer message
  const footerMessage =
    settings.footerMessage && settings.footerMessage.trim().length > 0
      ? settings.footerMessage
      : isRestaurant
      ? "Thank you for dining with us! Please visit us again."
      : "Thank you for shopping with us! Please visit us again.";

  const is58mm = settings.paperWidth === "58mm";
  const printWidthCss = is58mm ? "54mm" : "76mm";
  const printIframeWidth = is58mm ? "58mm" : "80mm";

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
    iframe.style.width = printIframeWidth;
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
              margin: 3mm auto;
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
              width: ${printWidthCss};
              max-width: ${printWidthCss};
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
            .text-xs { font-size: ${is58mm ? "10px" : "11.5px"}; }
            .text-sm { font-size: ${is58mm ? "11.5px" : "13px"}; }
            .text-base { font-size: ${is58mm ? "13px" : "15px"}; }
            .text-\\[9px\\] { font-size: ${is58mm ? "8px" : "9px"}; }
            .text-\\[10px\\] { font-size: ${is58mm ? "9px" : "10px"}; }
            .text-\\[11px\\] { font-size: ${is58mm ? "10px" : "11px"}; }
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

  const toggleSettingQuick = (key: keyof InvoiceSettings) => {
    const updated = saveInvoiceSettings({ [key]: !settings[key] });
    setSettings(updated);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`w-full ${is58mm ? "max-w-[340px]" : "max-w-[420px]"} my-auto transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-3 py-4 w-full">
          {/* Header Bar */}
          <div className="flex items-center justify-between w-full px-1">
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 size={14} />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {isRestaurant ? "Dining Check Ready" : "Sale Completed"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowQuickSettings((p) => !p)}
                className={`p-1.5 rounded-sm border transition text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                  showQuickSettings
                    ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                    : "bg-white text-gray-700 border-slate-300 hover:bg-slate-50"
                }`}
                title="Invoice Visibility Controls"
              >
                <Sliders size={13} />
                <span className="hidden sm:inline text-[11px]">Controls</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-sm bg-white border border-slate-300 text-gray-500 hover:text-gray-800 hover:bg-slate-50 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick Visibility Drawer */}
          {showQuickSettings && (
            <div className="w-full bg-slate-900 text-white p-3.5 rounded-sm border border-slate-800 shadow-xl text-xs space-y-3 animate-in fade-in-50">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-[11px] text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={12} />
                  Receipt Visibility Controls
                </span>
                <span className="text-[10px] text-slate-400">
                  Paper: <strong>{settings.paperWidth}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showStoreHeader}
                    onChange={() => toggleSettingQuick("showStoreHeader")}
                    className="rounded text-teal-600"
                  />
                  <span>Store Header</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showVatBin}
                    onChange={() => toggleSettingQuick("showVatBin")}
                    className="rounded text-teal-600"
                  />
                  <span>BIN / Mushak 6.3</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showCustomer}
                    onChange={() => toggleSettingQuick("showCustomer")}
                    className="rounded text-teal-600"
                  />
                  <span>Customer Name</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showCashier}
                    onChange={() => toggleSettingQuick("showCashier")}
                    className="rounded text-teal-600"
                  />
                  <span>Cashier / Staff</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showItemSku}
                    onChange={() => toggleSettingQuick("showItemSku")}
                    className="rounded text-teal-600"
                  />
                  <span>Item SKU Code</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showBarcode}
                    onChange={() => toggleSettingQuick("showBarcode")}
                    className="rounded text-teal-600"
                  />
                  <span>Optical Barcode</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showVatBreakdown}
                    onChange={() => toggleSettingQuick("showVatBreakdown")}
                    className="rounded text-teal-600"
                  />
                  <span>VAT Line</span>
                </label>
                {!isRestaurant && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showReturnPolicy}
                      onChange={() => toggleSettingQuick("showReturnPolicy")}
                      className="rounded text-teal-600"
                    />
                    <span>7-Day Return Policy</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Thermal Receipt Paper Card */}
          <div
            id="thermal-receipt"
            className={`w-full rounded-sm border border-slate-200 bg-white p-5 shadow-lg text-xs text-gray-800 space-y-2.5 font-sans transition-all ${
              is58mm ? "max-w-[280px]" : "max-w-[390px]"
            }`}
          >
            {/* Store Header */}
            {settings.showStoreHeader && (
              <div className="text-center space-y-0.5">
                <h2 className="text-base font-extrabold tracking-wider text-black uppercase">
                  {settings.storeName || siteConfig.name || "BLUE OCEANS POS"}
                </h2>
                {settings.showStoreSubtitle && (
                  <p className="text-[11px] text-gray-700 font-medium">
                    {settings.storeSubtitle || (isRestaurant ? "Restaurant & Dine-in Guest Check" : "Dhaka Flagship Outlet • Counter #POS-01")}
                  </p>
                )}
                {settings.showVatBin && (
                  <p className="text-[10px] text-gray-600">
                    {settings.vatBinNo ? `BIN / VAT Reg: ${settings.vatBinNo}` : "BIN: 002938194-0101 • Mushak-6.3"}
                  </p>
                )}
                {settings.showPhoneContact && settings.phoneContact && (
                  <p className="text-[10px] text-gray-500 font-mono">
                    Tel: {settings.phoneContact}
                  </p>
                )}
              </div>
            )}

            {(settings.showStoreHeader || settings.showStoreSubtitle) && (
              <div className="border-t border-dashed border-gray-400 my-1.5" />
            )}

            {/* Meta Info */}
            <div className="space-y-1 text-xs">
              {settings.showInvoiceNo && (
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-500 font-medium">Invoice No:</span>
                  <span className="font-bold text-black font-mono tracking-tight">{data.invoiceNo}</span>
                </div>
              )}
              {settings.showDateTime && (
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-500 font-medium">Date & Time:</span>
                  <span className="text-gray-900 font-mono text-[11px]">{invoiceDate}</span>
                </div>
              )}
              {settings.showCustomer && (
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-500 font-medium">Customer:</span>
                  <span className="font-semibold text-black text-right max-w-[210px] break-words">
                    {data.customerName || "Walk-in Customer"}
                  </span>
                </div>
              )}
              {settings.showCashier && (
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-500 font-medium">{isRestaurant ? "Server / Waiter:" : "Cashier / Staff:"}</span>
                  <span className="font-semibold text-black text-right max-w-[210px] break-words">
                    {data.cashierName || "Admin"}
                  </span>
                </div>
              )}
              {settings.showOrderType && (data.orderType || data.tableNo) && (
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-500 font-medium">Order Type / Table:</span>
                  <span className="font-bold text-black text-right">
                    {data.tableNo ? `Table ${data.tableNo}` : data.orderType || "DINE_IN"}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-400 my-1.5" />

            {/* Items List */}
            {items.length > 0 && (
              <div>
                <div className="grid grid-cols-12 text-[10px] font-bold text-gray-800 uppercase tracking-wider border-b border-dashed border-gray-400 pb-1 mb-1.5">
                  <span className="col-span-6">ITEM / SKU</span>
                  <span className="col-span-1 text-center">QTY</span>
                  <span className="col-span-2 text-right">RATE</span>
                  <span className="col-span-3 text-right">TOTAL</span>
                </div>

                <div className="space-y-1.5">
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
                          {settings.showItemSku && (
                            <div className="text-[10px] text-gray-500 font-mono">SKU: {skuCode}</div>
                          )}
                        </div>
                        <div className="col-span-1 text-center font-bold text-black font-mono">{item.qty}</div>
                        <div className="col-span-2 text-right text-gray-800 font-mono">
                          {settings.showUnitPrice ? `৳${Number(item.unitPrice).toFixed(2)}` : "—"}
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

            <div className="border-t border-dashed border-gray-400 my-1.5" />

            {/* Financial Breakdown */}
            <div className="space-y-1 text-xs py-0.5">
              {settings.showSubtotal && (
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-mono font-bold text-black">৳{subtotal.toFixed(2)}</span>
                </div>
              )}

              {settings.showDiscount && discountTotal > 0 && (
                <div className="flex justify-between items-baseline text-emerald-800 font-medium">
                  <span>Discount:</span>
                  <span className="font-mono">-৳{discountTotal.toFixed(2)}</span>
                </div>
              )}

              {settings.showVatBreakdown && (vatAmount > 0 || (serviceCharge === 0 && discountTotal === 0)) && (
                <div className="flex justify-between items-baseline text-gray-700">
                  <span>VAT (Mushak 6.3{vatRateLabel ? ` - ${vatRateLabel}` : ""}):</span>
                  <span className="font-mono text-black">৳{vatAmount.toFixed(2)}</span>
                </div>
              )}

              {settings.showServiceCharge && serviceCharge > 0 && (
                <div className="flex justify-between items-baseline text-gray-700">
                  <span>Service Charge{scRateLabel}:</span>
                  <span className="font-mono text-black">৳{serviceCharge.toFixed(2)}</span>
                </div>
              )}

              {settings.showNetPayable && (
                <div className="flex justify-between items-baseline font-black text-sm text-black border-t-2 border-b-2 border-black py-1.5 my-1.5">
                  <span className="uppercase tracking-wider">NET PAYABLE:</span>
                  <span className="font-mono text-base tracking-tight">৳{netPayable.toFixed(2)}</span>
                </div>
              )}

              {settings.showPaymentMethod && (
                <div className="flex justify-between items-baseline pt-0.5">
                  <span className="text-gray-600">Tender Method:</span>
                  <span className="font-bold text-black font-mono">{primaryMethod}</span>
                </div>
              )}

              {settings.showPaidAmount && (
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="font-bold text-black font-mono">৳{paidTotal.toFixed(2)}</span>
                </div>
              )}

              {settings.showChangeReturn && Number(data.dueTotal || 0) > 0 && (
                <div className="flex justify-between items-baseline font-bold text-amber-900">
                  <span>Remaining Due:</span>
                  <span className="font-mono">৳{Number(data.dueTotal).toFixed(2)}</span>
                </div>
              )}

              {settings.showChangeReturn && (
                <div className="flex justify-between items-baseline font-bold text-emerald-900">
                  <span>Change / Return:</span>
                  <span className="font-mono">৳{changeReturn.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-400 my-1.5" />

            {/* Barcode & Footer */}
            <div className="text-center space-y-1 pt-0.5">
              {settings.showBarcode && (
                <div>
                  <BarcodeVector code={data.invoiceNo} />
                  <p className="text-[10px] text-gray-700 font-mono tracking-wider">*{data.invoiceNo}*</p>
                </div>
              )}

              {/* Return Policy Notice: Strictly omitted for restaurant or when disabled */}
              {showReturnPolicyText && (
                <p className="text-xs font-semibold text-gray-800 text-center max-w-[280px] mx-auto mt-2 leading-tight">
                  {settings.returnPolicyText}
                </p>
              )}

              {/* Thank you & greeting footer note */}
              {settings.showFooterNote && (
                <p className="text-xs font-semibold text-gray-700 text-center max-w-[280px] mx-auto mt-1 leading-tight">
                  {footerMessage}
                </p>
              )}

              {/* Attribution watermark */}
              {settings.showWatermark && (
                <p className="text-[10px] text-gray-400 text-center mt-2">
                  Software by Blue Oceans POS
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex w-full gap-2 mt-1">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-sm border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
            >
              <Printer size={15} />
              Print Thermal ({settings.paperWidth})
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
