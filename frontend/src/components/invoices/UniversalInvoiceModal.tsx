"use client";

import { useState, useMemo } from "react";
import {
  Printer,
  X,
  Store,
  Scale,
  Truck,
  UtensilsCrossed,
  Pill,
  Scissors,
  Wrench,
  Factory,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
  CreditCard,
  QrCode,
  Tag,
  User,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { siteConfig } from "@/config/site";

export type InvoiceVerticalType =
  | "retail"
  | "grocery"
  | "wholesale"
  | "restaurant"
  | "pharmacy"
  | "salon"
  | "repair"
  | "manufacturing";

export interface InvoiceItem {
  id?: string;
  name?: string;
  productName?: string;
  sku?: string;
  qty: number;
  unitPrice: number;
  discount?: number;
  total?: number;
  uom?: string;
  // Specialized attributes:
  weightKg?: number;
  pluCode?: string;
  batchNo?: string;
  expiryDate?: string;
  genericName?: string;
  dosage?: string;
  modifiers?: string[];
  stylistName?: string;
  serviceDuration?: string;
  partWarranty?: string;
  isSparePart?: boolean;
}

export interface InvoiceData {
  id: string;
  invoiceNo: string;
  saleDate?: string;
  createdAt?: string;
  vertical?: InvoiceVerticalType;
  customer?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    tradeLicense?: string;
    binVatNo?: string;
    previousBalance?: number;
  } | null;
  cashier?: {
    id?: string;
    name?: string;
  } | null;
  items: InvoiceItem[];
  subTotal?: number;
  discountTotal?: number;
  taxTotal?: number;
  vatRate?: number;
  serviceCharge?: number;
  deliveryCharge?: number;
  grandTotal: number;
  paidTotal: number;
  dueTotal: number;
  paymentMethod?: string;
  notes?: string;
  branchName?: string;
  branchAddress?: string;
  terminalCode?: string;

  // Vertical specific metadata
  tableNo?: string;
  serverName?: string;
  guestCount?: number;
  orderType?: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  doctorName?: string;
  patientAge?: string;
  prescriptionNo?: string;
  deviceModel?: string;
  imeiSerial?: string;
  diagnosedProblem?: string;
  repairStatus?: string;
  vehicleNo?: string;
  driverName?: string;
  challanNo?: string;
  paymentTerms?: string;
  loyaltyPointsEarned?: number;
  loyaltyPointsBalance?: number;
  batchProductionDate?: string;
  batchBestBefore?: string;
}

interface UniversalInvoiceModalProps {
  data: InvoiceData;
  initialVertical?: InvoiceVerticalType;
  onClose: () => void;
}

const VERTICAL_OPTIONS: { id: InvoiceVerticalType; label: string; icon: any; color: string }[] = [
  { id: "retail", label: "Retail Standard POS", icon: Store, color: "text-indigo-600" },
  { id: "grocery", label: "Grocery / Supermarket Lane", icon: Scale, color: "text-emerald-600" },
  { id: "wholesale", label: "Wholesale B2B Challan", icon: Truck, color: "text-blue-600" },
  { id: "restaurant", label: "Restaurant & Cafe Bill", icon: UtensilsCrossed, color: "text-amber-600" },
  { id: "pharmacy", label: "Pharmacy & Rx Dispense", icon: Pill, color: "text-teal-600" },
  { id: "salon", label: "Salon & Spa Service Slip", icon: Scissors, color: "text-pink-600" },
  { id: "repair", label: "Repair Service Job Invoice", icon: Wrench, color: "text-orange-600" },
  { id: "manufacturing", label: "Bakery / Batch Delivery", icon: Factory, color: "text-slate-600" },
];

export function UniversalInvoiceModal({
  data,
  initialVertical,
  onClose,
}: UniversalInvoiceModalProps) {
  // Auto-detect vertical if not explicitly provided
  const detectedVertical = useMemo<InvoiceVerticalType>(() => {
    if (initialVertical) return initialVertical;
    if (data.vertical) return data.vertical;
    if (data.tableNo || data.serverName) return "restaurant";
    if (data.doctorName || data.prescriptionNo) return "pharmacy";
    if (data.deviceModel || data.imeiSerial) return "repair";
    if (data.challanNo || data.vehicleNo || data.paymentTerms) return "wholesale";
    if (data.items?.some((i) => i.weightKg || i.pluCode)) return "grocery";
    if (data.items?.some((i) => i.stylistName)) return "salon";
    return "retail";
  }, [data, initialVertical]);

  const [activeVertical, setActiveVertical] = useState<InvoiceVerticalType>(detectedVertical);
  const [printPaperSize, setPrintPaperSize] = useState<"thermal" | "a4">("thermal");

  const fmt = (n: number) =>
    `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const invoiceDate = data.saleDate || data.createdAt ? new Date(data.saleDate || data.createdAt!).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-5 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-100 my-auto overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-200/80 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-900 text-white shadow-2xs">
              <FileText size={16} />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                Invoice Details: <span className="font-mono text-primary-600">{data.invoiceNo}</span>
              </h3>
              <p className="text-[11px] text-slate-500">Vertical-specific print and receipt generation</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Template Selector */}
            <div className="relative flex items-center">
              <select
                value={activeVertical}
                onChange={(e) => setActiveVertical(e.target.value as InvoiceVerticalType)}
                className="appearance-none rounded-xl border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-xs font-bold text-slate-800 shadow-2xs focus:border-primary-500 focus:outline-none"
              >
                {VERTICAL_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    Template: {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Paper Size Selector */}
            <div className="flex rounded-xl bg-slate-200/80 p-0.5 text-[11px] font-bold">
              <button
                onClick={() => setPrintPaperSize("thermal")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  printPaperSize === "thermal" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
                }`}
              >
                Thermal (80mm)
              </button>
              <button
                onClick={() => setPrintPaperSize("a4")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  printPaperSize === "a4" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
                }`}
              >
                A4 / Letter
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-black text-white hover:bg-slate-800 shadow-sm transition"
            >
              <Printer size={14} /> Print
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/60 flex justify-center">
          <div
            id="printable-invoice"
            className={`w-full bg-white border border-slate-200/80 shadow-md p-6 sm:p-8 transition-all ${
              printPaperSize === "thermal" ? "max-w-[420px] rounded-2xl" : "max-w-3xl rounded-3xl"
            }`}
          >
            {/* 1. RETAIL POS TEMPLATE */}
            {activeVertical === "retail" && (
              <RetailInvoiceTemplate data={data} fmt={fmt} invoiceDate={invoiceDate} />
            )}

            {/* 2. GROCERY / SUPERMARKET TEMPLATE */}
            {activeVertical === "grocery" && (
              <GroceryInvoiceTemplate data={data} fmt={fmt} invoiceDate={invoiceDate} />
            )}

            {/* 3. WHOLESALE & B2B COMMERCIAL CHALLAN TEMPLATE */}
            {activeVertical === "wholesale" && (
              <WholesaleInvoiceTemplate data={data} fmt={fmt} invoiceDate={invoiceDate} />
            )}

            {/* 4. RESTAURANT & CAFE BILL TEMPLATE */}
            {activeVertical === "restaurant" && (
              <RestaurantInvoiceTemplate data={data} fmt={fmt} invoiceDate={invoiceDate} />
            )}

            {/* 5. PHARMACY & RX DISPENSE TEMPLATE */}
            {activeVertical === "pharmacy" && (
              <PharmacyInvoiceTemplate data={data} fmt={fmt} invoiceDate={invoiceDate} />
            )}

            {/* 6. SALON & SPA SERVICE SLIP */}
            {activeVertical === "salon" && (
              <SalonInvoiceTemplate data={data} fmt={fmt} invoiceDate={invoiceDate} />
            )}

            {/* 7. REPAIR & SERVICE JOB INVOICE */}
            {activeVertical === "repair" && (
              <RepairInvoiceTemplate data={data} fmt={fmt} invoiceDate={invoiceDate} />
            )}

            {/* 8. MANUFACTURING & BAKERY BATCH SLIP */}
            {activeVertical === "manufacturing" && (
              <ManufacturingInvoiceTemplate data={data} fmt={fmt} invoiceDate={invoiceDate} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TEMPLATE 1: RETAIL POS STANDARD INVOICE
// ───────────────────────────────────────────────────────────────────────

function RetailInvoiceTemplate({ data, fmt, invoiceDate }: { data: InvoiceData; fmt: (n: number) => string; invoiceDate: string }) {
  return (
    <div className="font-mono text-xs text-slate-800 space-y-4">
      <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
        <h2 className="text-base font-black tracking-tight text-slate-950 uppercase">{siteConfig.name}</h2>
        <p className="text-[11px] text-slate-600">{data.branchName || "Dhaka Flagship Outlet"} • Counter #{data.terminalCode || "POS-01"}</p>
        <p className="text-[10px] text-slate-500">BIN / VAT Reg No: 002938194-0101 • Mushak-6.3</p>
      </div>

      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 border-b border-dashed border-slate-300 pb-3">
        <div><span className="text-slate-400">Invoice:</span> <strong className="text-slate-900">{data.invoiceNo}</strong></div>
        <div className="text-right"><span className="text-slate-400">Date:</span> {invoiceDate}</div>
        <div><span className="text-slate-400">Customer:</span> {data.customer?.name || "Walk-in Patron"}</div>
        <div className="text-right"><span className="text-slate-400">Cashier:</span> {data.cashier?.name || "Admin"}</div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase">
            <th className="py-1">Item / SKU</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">Rate</th>
            <th className="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(data.items || []).map((item, idx) => (
            <tr key={idx} className="py-1.5">
              <td className="py-1.5 pr-2">
                <span className="font-bold text-slate-900">{item.productName || item.name || "Item"}</span>
                {item.sku && <span className="block text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>}
              </td>
              <td className="py-1.5 text-center">{item.qty}</td>
              <td className="py-1.5 text-right">{fmt(item.unitPrice)}</td>
              <td className="py-1.5 text-right font-bold text-slate-900">{fmt(item.qty * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal:</span>
          <span>{fmt(data.subTotal || data.grandTotal)}</span>
        </div>
        {!!data.discountTotal && (
          <div className="flex justify-between text-emerald-700">
            <span>Special Discount:</span>
            <span>-{fmt(data.discountTotal)}</span>
          </div>
        )}
        <div className="flex justify-between text-slate-500 text-[11px]">
          <span>VAT (Mushak 6.3 - 5%):</span>
          <span>{fmt(data.taxTotal || data.grandTotal * 0.05)}</span>
        </div>
        <div className="flex justify-between font-black text-sm text-slate-950 border-t border-b border-slate-300 py-1.5 my-1">
          <span>Net Payable:</span>
          <span className="tabular-nums">{fmt(data.grandTotal)}</span>
        </div>
        <div className="flex justify-between text-slate-700">
          <span>Tender Method:</span>
          <span className="font-bold">{data.paymentMethod || "CASH"} (Paid: {fmt(data.paidTotal)})</span>
        </div>
        {data.dueTotal > 0 && (
          <div className="flex justify-between text-amber-700 font-bold">
            <span>Remaining Due:</span>
            <span>{fmt(data.dueTotal)}</span>
          </div>
        )}
        {data.paidTotal > data.grandTotal && (
          <div className="flex justify-between text-emerald-700 font-bold">
            <span>Change Return:</span>
            <span>{fmt(data.paidTotal - data.grandTotal)}</span>
          </div>
        )}
      </div>

      <BarcodeFooter invoiceNo={data.invoiceNo} footerText="Items can be exchanged within 7 days with original receipt." />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TEMPLATE 2: GROCERY & SUPERMARKET SCALE LANE RECEIPT
// ───────────────────────────────────────────────────────────────────────

function GroceryInvoiceTemplate({ data, fmt, invoiceDate }: { data: InvoiceData; fmt: (n: number) => string; invoiceDate: string }) {
  return (
    <div className="font-mono text-xs text-slate-800 space-y-4">
      <div className="text-center border-b border-dashed border-emerald-300 pb-3 space-y-1">
        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mb-1">
          <Scale size={12} /> Supermarket Express Lane Checkout
        </div>
        <h2 className="text-base font-black tracking-tight text-slate-950 uppercase">{siteConfig.name} SUPERSTORE</h2>
        <p className="text-[11px] text-slate-600">Express Scanner Lane #{data.terminalCode || "04"} • NBR Mushak-6.3</p>
      </div>

      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 border-b border-dashed border-slate-300 pb-3">
        <div><span className="text-slate-400">Slip No:</span> <strong className="text-slate-900">{data.invoiceNo}</strong></div>
        <div className="text-right"><span className="text-slate-400">Date:</span> {invoiceDate}</div>
        <div><span className="text-slate-400">Lane Operator:</span> {data.cashier?.name || "Lane Cashier"}</div>
        <div className="text-right"><span className="text-slate-400">Loyalty ID:</span> {data.customer?.phone || "Guest"}</div>
      </div>

      {/* Produce / Items breakdown with Tare & PLU */}
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase">
            <th className="py-1">Description / PLU</th>
            <th className="py-1 text-center">Net Wt / Qty</th>
            <th className="py-1 text-right">Rate / Unit</th>
            <th className="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(data.items || []).map((item, idx) => {
            const isScaleItem = item.weightKg || item.pluCode || item.uom?.toLowerCase().includes("kg");
            return (
              <tr key={idx} className="py-1.5">
                <td className="py-1.5 pr-2">
                  <span className="font-bold text-slate-900">{item.productName || item.name || "Item"}</span>
                  {isScaleItem && (
                    <span className="block text-[10px] text-emerald-700 font-bold">
                      [PLU #{item.pluCode || "4011"}] Tare: 0.015kg • Gross: {((item.weightKg || item.qty) + 0.015).toFixed(3)}kg
                    </span>
                  )}
                </td>
                <td className="py-1.5 text-center font-bold">
                  {isScaleItem ? `${Number(item.weightKg || item.qty).toFixed(3)} kg` : item.qty}
                </td>
                <td className="py-1.5 text-right">{fmt(item.unitPrice)}</td>
                <td className="py-1.5 text-right font-bold text-slate-900">{fmt(item.qty * item.unitPrice)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Financial & Loyalty Breakdown */}
      <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Items Total:</span>
          <span>{fmt(data.subTotal || data.grandTotal)}</span>
        </div>
        <div className="flex justify-between text-slate-500 text-[11px]">
          <span>Carry Bag Eco-Charge:</span>
          <span>৳5.00</span>
        </div>
        <div className="flex justify-between text-slate-500 text-[11px]">
          <span>NBR Mushak VAT (5% Included):</span>
          <span>{fmt(data.taxTotal || data.grandTotal * 0.05)}</span>
        </div>
        <div className="flex justify-between font-black text-sm text-slate-950 border-t border-b border-emerald-200 bg-emerald-50/50 p-1.5 my-1 rounded-lg">
          <span>Grand Total:</span>
          <span className="tabular-nums text-emerald-800">{fmt(data.grandTotal)}</span>
        </div>
        <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
          <span>Loyalty Club Points Earned:</span>
          <span>+{data.loyaltyPointsEarned || Math.floor(data.grandTotal / 100)} pts (Bal: {data.loyaltyPointsBalance || 240} pts)</span>
        </div>
      </div>

      <BarcodeFooter invoiceNo={data.invoiceNo} footerText="Fresh produce quality guaranteed. Please check weighing tare at counter." />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TEMPLATE 3: WHOLESALE & B2B COMMERCIAL DELIVERY CHALLAN & INVOICE
// ───────────────────────────────────────────────────────────────────────

function WholesaleInvoiceTemplate({ data, fmt, invoiceDate }: { data: InvoiceData; fmt: (n: number) => string; invoiceDate: string }) {
  return (
    <div className="font-sans text-xs text-slate-800 space-y-5">
      {/* Header Commercial Banner */}
      <div className="flex justify-between items-start border-b-2 border-blue-900 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md mb-1.5">
            <Truck size={14} /> Commercial B2B Tax Invoice & Delivery Challan
          </div>
          <h2 className="text-xl font-black text-slate-950 tracking-tight">{siteConfig.name} DISTRIBUTION HUB</h2>
          <p className="text-[11px] text-slate-500">Corporate HQ • Central Logistics & Warehouse Division</p>
          <p className="text-[10px] text-slate-500 font-mono">BIN: 004819203-0201 • Trade Lic: TRAD/DSCC/019284/2024</p>
        </div>
        <div className="text-right space-y-1 font-mono text-xs">
          <div className="text-base font-black text-blue-900">CHALLAN: {data.challanNo || `CH-${data.invoiceNo}`}</div>
          <div>Invoice Ref: <strong>{data.invoiceNo}</strong></div>
          <div className="text-slate-500">Date: {invoiceDate}</div>
          <div className="text-slate-500">Terms: <span className="font-bold text-slate-800">{data.paymentTerms || "Net 30 Days"}</span></div>
        </div>
      </div>

      {/* Buyer Client & Transport Info Grid */}
      <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consignee / B2B Client Details</p>
          <h4 className="text-sm font-bold text-slate-900 mt-0.5">{data.customer?.name || "Corporate Wholesale Client"}</h4>
          <p className="text-slate-600 text-[11px] mt-0.5">{data.customer?.address || "Commercial Enterprise District, Tejgaon I/A, Dhaka"}</p>
          <p className="text-slate-500 text-[10px] font-mono mt-1">
            Client TIN / BIN: {data.customer?.binVatNo || "192837465-0101"} • Contact: {data.customer?.phone || "+880 1711-000000"}
          </p>
        </div>
        <div className="border-l border-slate-200 pl-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dispatch & Logistics Details</p>
          <p className="text-[11px] text-slate-700 mt-1">Vehicle / Truck No: <strong className="font-mono">{data.vehicleNo || "DHAKA METRO-TA-11-9482"}</strong></p>
          <p className="text-[11px] text-slate-700">Driver / Dispatcher: <strong>{data.driverName || "Md. Rafiqul Islam (+880 1819-223344)"}</strong></p>
          <p className="text-[11px] text-slate-700">Packaging Type: <strong>Corrugated Master Cartons (Sealed)</strong></p>
        </div>
      </div>

      {/* Commercial Line Items Table */}
      <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
        <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
          <tr>
            <th className="py-2.5 px-3">SL</th>
            <th className="py-2.5 px-3">Description & Pack Spec</th>
            <th className="py-2.5 px-3 text-center">Cartons</th>
            <th className="py-2.5 px-3 text-center">Total Qty (Pcs)</th>
            <th className="py-2.5 px-3 text-right">Unit Rate (৳)</th>
            <th className="py-2.5 px-3 text-right">Amount (৳)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-medium">
          {(data.items || []).map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-50">
              <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
              <td className="py-2 px-3">
                <span className="font-bold text-slate-900">{item.productName || item.name || "Commercial Product"}</span>
                <span className="block text-[10px] text-slate-400 font-mono">SKU: {item.sku || "WS-SKU-99"} • Master Carton: 24 units/ctn</span>
              </td>
              <td className="py-2 px-3 text-center font-bold font-mono">{Math.ceil(item.qty / 24)} ctn</td>
              <td className="py-2 px-3 text-center font-bold">{item.qty} {item.uom || "units"}</td>
              <td className="py-2 px-3 text-right font-mono">{fmt(item.unitPrice)}</td>
              <td className="py-2 px-3 text-right font-black font-mono text-slate-900">{fmt(item.qty * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Commercial Credit & Total Summary */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
          <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Client Credit Ledger Summary</p>
          <div className="flex justify-between text-slate-600">
            <span>Previous Outstanding Due:</span>
            <span className="font-mono">{fmt(data.customer?.previousBalance || 45000)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Current Invoice Total:</span>
            <span className="font-mono font-bold text-blue-900">+{fmt(data.grandTotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Paid Against Challan:</span>
            <span className="font-mono text-emerald-700">-{fmt(data.paidTotal)}</span>
          </div>
          <div className="flex justify-between font-black text-amber-700 border-t border-slate-200 pt-1">
            <span>New Outstanding Receivable:</span>
            <span className="font-mono">{fmt((data.customer?.previousBalance || 45000) + data.grandTotal - data.paidTotal)}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal (Excl. Tax):</span>
            <span className="font-mono">{fmt(data.subTotal || data.grandTotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Commercial B2B Trade Discount:</span>
            <span className="font-mono text-emerald-700">-{fmt(data.discountTotal || 0)}</span>
          </div>
          <div className="flex justify-between font-black text-base text-blue-950 border-t border-blue-200 pt-1.5">
            <span>Grand Invoiced Total:</span>
            <span className="font-mono tabular-nums">{fmt(data.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs text-slate-600">
        <div className="border-t border-slate-400 pt-1.5">
          <p className="font-bold">Prepared By / Dispatcher</p>
          <span className="text-[10px] text-slate-400">Logistics Officer</span>
        </div>
        <div className="border-t border-slate-400 pt-1.5">
          <p className="font-bold">Transport & Driver Sign</p>
          <span className="text-[10px] text-slate-400">Goods in Transit</span>
        </div>
        <div className="border-t border-slate-400 pt-1.5">
          <p className="font-bold">Received in Good Order</p>
          <span className="text-[10px] text-slate-400">Authorized Client Stamp</span>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TEMPLATE 4: RESTAURANT & CAFE GUEST CHECK / BILL
// ───────────────────────────────────────────────────────────────────────

function RestaurantInvoiceTemplate({ data, fmt, invoiceDate }: { data: InvoiceData; fmt: (n: number) => string; invoiceDate: string }) {
  return (
    <div className="font-mono text-xs text-slate-800 space-y-4">
      <div className="text-center border-b border-dashed border-amber-300 pb-3 space-y-1">
        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full mb-1">
          <UtensilsCrossed size={12} /> Restaurant & Cafe Guest Check
        </div>
        <h2 className="text-base font-black tracking-tight text-slate-950 uppercase">{siteConfig.name} RESTAURANT & LOUNGE</h2>
        <p className="text-[11px] text-slate-600">Dine-in Guest Folio • NBR Mushak-6.3</p>
      </div>

      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 border-b border-dashed border-slate-300 pb-3">
        <div><span className="text-slate-400">Table No:</span> <strong className="text-base text-amber-800">{data.tableNo || "T-08 (VIP Booth)"}</strong></div>
        <div className="text-right"><span className="text-slate-400">Covers / Guests:</span> <strong>{data.guestCount || 4} Persons</strong></div>
        <div><span className="text-slate-400">Server / Waiter:</span> <strong>{data.serverName || "Waiter Sumon"}</strong></div>
        <div className="text-right"><span className="text-slate-400">Order Ref:</span> {data.invoiceNo}</div>
        <div><span className="text-slate-400">Time:</span> {invoiceDate}</div>
        <div className="text-right"><span className="text-slate-400">Type:</span> <strong>{data.orderType || "DINE_IN"}</strong></div>
      </div>

      {/* Courses & Dishes */}
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase">
            <th className="py-1">Dish / Course</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">Price</th>
            <th className="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(data.items || []).map((item, idx) => (
            <tr key={idx} className="py-1.5">
              <td className="py-1.5 pr-2">
                <span className="font-bold text-slate-900">{item.productName || item.name || "Dish"}</span>
                {item.modifiers && item.modifiers.length > 0 ? (
                  <span className="block text-[10px] text-amber-700 italic">★ {item.modifiers.join(", ")}</span>
                ) : (
                  <span className="block text-[10px] text-slate-400 italic">Chef Special • Made Fresh</span>
                )}
              </td>
              <td className="py-1.5 text-center font-bold">{item.qty}</td>
              <td className="py-1.5 text-right">{fmt(item.unitPrice)}</td>
              <td className="py-1.5 text-right font-bold text-slate-900">{fmt(item.qty * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bill Calculation (Service Charge + SD + VAT) */}
      <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Food & Beverage Subtotal:</span>
          <span>{fmt(data.subTotal || data.grandTotal)}</span>
        </div>
        <div className="flex justify-between text-slate-500 text-[11px]">
          <span>Service Charge (10%):</span>
          <span>{fmt((data.subTotal || data.grandTotal) * 0.1)}</span>
        </div>
        <div className="flex justify-between text-slate-500 text-[11px]">
          <span>NBR Supplementary Duty (SD 10%):</span>
          <span>{fmt((data.subTotal || data.grandTotal) * 0.1)}</span>
        </div>
        <div className="flex justify-between text-slate-500 text-[11px]">
          <span>VAT (Mushak 6.3 - 5%):</span>
          <span>{fmt((data.subTotal || data.grandTotal) * 0.05)}</span>
        </div>
        <div className="flex justify-between font-black text-sm text-slate-950 border-t border-b border-amber-300 bg-amber-50/50 p-2 my-1 rounded-lg">
          <span>Total Guest Bill:</span>
          <span className="tabular-nums text-amber-900">{fmt(data.grandTotal)}</span>
        </div>
        <div className="flex justify-between text-slate-600 pt-1">
          <span>Tender Method:</span>
          <span className="font-bold">{data.paymentMethod || "CARD / SPLIT"}</span>
        </div>
      </div>

      <BarcodeFooter invoiceNo={data.invoiceNo} footerText="Gratuity / Tips are optional & appreciated. Hope to see you again soon!" />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TEMPLATE 5: PHARMACY & HEALTHCARE PRESCRIPTION INVOICE
// ───────────────────────────────────────────────────────────────────────

function PharmacyInvoiceTemplate({ data, fmt, invoiceDate }: { data: InvoiceData; fmt: (n: number) => string; invoiceDate: string }) {
  return (
    <div className="font-mono text-xs text-slate-800 space-y-4">
      <div className="text-center border-b border-dashed border-teal-400 pb-3 space-y-1">
        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full mb-1">
          <Pill size={12} /> DGDA Licensed Pharmacy & Prescription Dispense
        </div>
        <h2 className="text-base font-black tracking-tight text-slate-950 uppercase">{siteConfig.name} PHARMACY & CLINIC</h2>
        <p className="text-[11px] text-slate-600">Drug License No: DL-DHK-84920 • FEFO Quality Inspected</p>
      </div>

      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 border-b border-dashed border-slate-300 pb-3">
        <div><span className="text-slate-400">Patient:</span> <strong>{data.customer?.name || "Patient Walk-in"}</strong></div>
        <div className="text-right"><span className="text-slate-400">Rx No:</span> <strong className="text-teal-800">{data.prescriptionNo || "RX-84920"}</strong></div>
        <div><span className="text-slate-400">Doctor:</span> {data.doctorName || "Dr. K. Zaman, MBBS, FCPS"}</div>
        <div className="text-right"><span className="text-slate-400">Date:</span> {invoiceDate}</div>
      </div>

      {/* Drugs with Generic, Batch, Expiry & Dosage */}
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase">
            <th className="py-1">Medicine / Generic / Batch</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">MRP (৳)</th>
            <th className="py-1 text-right">Total (৳)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(data.items || []).map((item, idx) => (
            <tr key={idx} className="py-1.5">
              <td className="py-1.5 pr-2">
                <span className="font-bold text-slate-900">{item.productName || item.name || "Medicine"}</span>
                <span className="block text-[10px] text-slate-500 font-sans">
                  Gen: {item.genericName || "Paracetamol 500mg"} • Dose: <span className="font-bold text-teal-700">{item.dosage || "1+0+1 (After Meal)"}</span>
                </span>
                <span className="block text-[9px] text-teal-800 font-mono">
                  Batch: {item.batchNo || "BX-2024-09"} • Exp: {item.expiryDate || "10/2026"} (FEFO Verified)
                </span>
              </td>
              <td className="py-1.5 text-center font-bold">{item.qty} pcs</td>
              <td className="py-1.5 text-right">{fmt(item.unitPrice)}</td>
              <td className="py-1.5 text-right font-bold text-slate-900">{fmt(item.qty * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total & Pharmacist Attestation */}
      <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Prescription Bill Total:</span>
          <span className="font-bold text-slate-900">{fmt(data.grandTotal)}</span>
        </div>
        <div className="flex justify-between text-slate-500 text-[11px]">
          <span>DGDA Essential Drug Price Compliance:</span>
          <span>Verified (0% VAT)</span>
        </div>
        <div className="flex justify-between font-black text-sm text-teal-900 border-t border-b border-teal-200 bg-teal-50/50 p-2 my-1 rounded-lg">
          <span>Net Paid:</span>
          <span className="tabular-nums">{fmt(data.paidTotal || data.grandTotal)}</span>
        </div>
      </div>

      <div className="pt-2 text-center text-[10px] text-slate-500">
        <p className="font-bold text-slate-700">Dispensed by: Registered "A" Grade Pharmacist (Reg # 9284)</p>
        <p className="text-[9px] text-slate-400 mt-0.5">Keep medicines in a cool, dry place out of reach of children.</p>
      </div>

      <BarcodeFooter invoiceNo={data.invoiceNo} />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TEMPLATE 6: SALON & SPA SERVICE SLIP
// ───────────────────────────────────────────────────────────────────────

function SalonInvoiceTemplate({ data, fmt, invoiceDate }: { data: InvoiceData; fmt: (n: number) => string; invoiceDate: string }) {
  return (
    <div className="font-mono text-xs text-slate-800 space-y-4">
      <div className="text-center border-b border-dashed border-pink-300 pb-3 space-y-1">
        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full mb-1">
          <Scissors size={12} /> Salon & Spa Beauty Service Voucher
        </div>
        <h2 className="text-base font-black tracking-tight text-slate-950 uppercase">{siteConfig.name} SALON & SPA</h2>
        <p className="text-[11px] text-slate-600">Station / Chair #03 • Senior Stylist Appointment</p>
      </div>

      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 border-b border-dashed border-slate-300 pb-3">
        <div><span className="text-slate-400">Client:</span> <strong>{data.customer?.name || "VIP Salon Client"}</strong></div>
        <div className="text-right"><span className="text-slate-400">Stylist:</span> <strong>{data.serverName || "Master Stylist Farhana"}</strong></div>
        <div><span className="text-slate-400">Date:</span> {invoiceDate}</div>
        <div className="text-right"><span className="text-slate-400">Voucher:</span> {data.invoiceNo}</div>
      </div>

      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase">
            <th className="py-1">Service / Treatment</th>
            <th className="py-1 text-center">Duration</th>
            <th className="py-1 text-right">Fee</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(data.items || []).map((item, idx) => (
            <tr key={idx} className="py-1.5">
              <td className="py-1.5 pr-2">
                <span className="font-bold text-slate-900">{item.productName || item.name || "Salon Treatment"}</span>
                <span className="block text-[10px] text-pink-700">★ Stylist: {item.stylistName || "Lead Artist"}</span>
              </td>
              <td className="py-1.5 text-center">{item.serviceDuration || "45 mins"}</td>
              <td className="py-1.5 text-right font-bold text-slate-900">{fmt(item.unitPrice * item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-xs">
        <div className="flex justify-between font-black text-sm text-pink-900 border-t border-b border-pink-200 bg-pink-50/50 p-2 my-1 rounded-lg">
          <span>Total Service Fee:</span>
          <span>{fmt(data.grandTotal)}</span>
        </div>
      </div>

      <BarcodeFooter invoiceNo={data.invoiceNo} footerText="Next recommended touch-up: 4 weeks. Thank you for visiting!" />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TEMPLATE 7: REPAIR & SERVICE JOB INVOICE
// ───────────────────────────────────────────────────────────────────────

function RepairInvoiceTemplate({ data, fmt, invoiceDate }: { data: InvoiceData; fmt: (n: number) => string; invoiceDate: string }) {
  return (
    <div className="font-mono text-xs text-slate-800 space-y-4">
      <div className="text-center border-b border-dashed border-orange-300 pb-3 space-y-1">
        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded-full mb-1">
          <Wrench size={12} /> Tech Repair Center Job Card & Invoice
        </div>
        <h2 className="text-base font-black tracking-tight text-slate-950 uppercase">{siteConfig.name} REPAIR CARE</h2>
        <p className="text-[11px] text-slate-600">Hardware & Screen Replacement Warranty Invoice</p>
      </div>

      <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 text-[11px] space-y-1">
        <div className="flex justify-between">
          <span>Device Model:</span>
          <strong className="text-slate-900">{data.deviceModel || "iPhone 15 Pro Max (256GB)"}</strong>
        </div>
        <div className="flex justify-between">
          <span>IMEI / Serial #:</span>
          <strong className="font-mono">{data.imeiSerial || "358920194820192"}</strong>
        </div>
        <div className="flex justify-between">
          <span>Diagnosed Fault:</span>
          <span className="text-orange-900 font-bold">{data.diagnosedProblem || "Display Touch Broken + Battery Health 72%"}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery Status:</span>
          <span className="text-emerald-700 font-bold">READY FOR HANDOVER (Tested OK)</span>
        </div>
      </div>

      {/* Parts & Labor breakdown */}
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase">
            <th className="py-1">Part / Service Description</th>
            <th className="py-1 text-center">Warranty</th>
            <th className="py-1 text-right">Cost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(data.items || []).map((item, idx) => (
            <tr key={idx} className="py-1.5">
              <td className="py-1.5 pr-2">
                <span className="font-bold text-slate-900">{item.productName || item.name || "Spare Part"}</span>
              </td>
              <td className="py-1.5 text-center text-[10px] text-emerald-700 font-bold">{item.partWarranty || "90 Days"}</td>
              <td className="py-1.5 text-right font-bold text-slate-900">{fmt(item.unitPrice * item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-xs">
        <div className="flex justify-between font-black text-sm text-slate-900 border-t border-b border-orange-200 bg-orange-50/50 p-2 my-1 rounded-lg">
          <span>Total Repair Charge:</span>
          <span>{fmt(data.grandTotal)}</span>
        </div>
      </div>

      <BarcodeFooter invoiceNo={data.invoiceNo} footerText="90-day replacement warranty on replaced genuine parts with this invoice." />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TEMPLATE 8: MANUFACTURING & BAKERY DELIVERY SLIP
// ───────────────────────────────────────────────────────────────────────

function ManufacturingInvoiceTemplate({ data, fmt, invoiceDate }: { data: InvoiceData; fmt: (n: number) => string; invoiceDate: string }) {
  return (
    <div className="font-mono text-xs text-slate-800 space-y-4">
      <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full mb-1">
          <Factory size={12} /> Bakery & Production Batch Delivery
        </div>
        <h2 className="text-base font-black tracking-tight text-slate-950 uppercase">{siteConfig.name} FOODS & BAKERY</h2>
        <p className="text-[11px] text-slate-600">BSTI & ISO 22000 Certified Production Facility</p>
      </div>

      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 border-b border-dashed border-slate-300 pb-3">
        <div><span className="text-slate-400">Batch Code:</span> <strong className="text-slate-900">BAT-BK-2024-09</strong></div>
        <div className="text-right"><span className="text-slate-400">Prod Date:</span> {data.batchProductionDate || "Today 04:00 AM"}</div>
        <div><span className="text-slate-400">Best Before:</span> <strong>{data.batchBestBefore || "4 Days from bake"}</strong></div>
        <div className="text-right"><span className="text-slate-400">Delivery Slip:</span> {data.invoiceNo}</div>
      </div>

      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase">
            <th className="py-1">Bakery Product / Pack Size</th>
            <th className="py-1 text-center">Packs</th>
            <th className="py-1 text-right">Rate</th>
            <th className="py-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(data.items || []).map((item, idx) => (
            <tr key={idx} className="py-1.5">
              <td className="py-1.5 pr-2 font-bold text-slate-900">{item.productName || item.name || "Bakery Item"}</td>
              <td className="py-1.5 text-center">{item.qty} packs</td>
              <td className="py-1.5 text-right">{fmt(item.unitPrice)}</td>
              <td className="py-1.5 text-right font-bold text-slate-900">{fmt(item.unitPrice * item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-xs">
        <div className="flex justify-between font-black text-sm text-slate-900 border-t border-b border-slate-200 p-2 my-1 rounded-lg">
          <span>Total Batch Invoiced:</span>
          <span>{fmt(data.grandTotal)}</span>
        </div>
      </div>

      <BarcodeFooter invoiceNo={data.invoiceNo} footerText="Quality tested & sealed. Store at room temperature away from sunlight." />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// SHARED BARCODE FOOTER
// ───────────────────────────────────────────────────────────────────────

function BarcodeFooter({ invoiceNo, footerText }: { invoiceNo: string; footerText?: string }) {
  return (
    <div className="text-center border-t border-dashed border-slate-300 pt-3 space-y-1">
      <div className="flex justify-center py-1">
        <div className="flex items-center gap-0.5 h-7 px-2 bg-slate-100 rounded">
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
      <p className="text-[10px] text-slate-400 font-mono">*{invoiceNo}*</p>
      {footerText && <p className="text-[11px] font-semibold text-slate-700 mt-1">{footerText}</p>}
      <p className="text-[9px] text-slate-400">Software by Blue Oceans OmniPOS Cloud • Spec §33</p>
    </div>
  );
}
