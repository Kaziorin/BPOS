"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  ShoppingCart,
  FileText,
  ClipboardList,
  TrendingUp,
  Eye,
  Printer,
  Search,
  RefreshCw,
  Store,
  Scale,
  Truck,
  UtensilsCrossed,
  Pill,
  Scissors,
  Wrench,
  Factory,
  CreditCard,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  UniversalInvoiceModal,
  type InvoiceData,
  type InvoiceVerticalType,
} from "@/components/invoices/UniversalInvoiceModal";

interface SaleSummary {
  id: string;
  invoiceNo: string;
  saleDate: string;
  createdAt?: string;
  total: number;
  subTotal?: number;
  paidTotal: number;
  dueTotal: number;
  paymentStatus: string;
  status: string;
  paymentMethod?: string;
  vertical?: InvoiceVerticalType;
  customer?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  } | null;
  items?: any[];
  tableNo?: string;
  serverName?: string;
  doctorName?: string;
  deviceModel?: string;
  challanNo?: string;
  notes?: string;
}

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  RETURNED: "bg-orange-50 text-orange-700 border-orange-200",
  DRAFT: "bg-slate-50 text-slate-600 border-slate-200",
};

const PAY_COLOR: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700",
  PARTIAL: "bg-amber-50 text-amber-700",
  UNPAID: "bg-red-50 text-red-700",
};

const VERTICAL_TABS = [
  { key: "ALL", label: "All Sales Transactions", icon: FileText },
  { key: "retail", label: "Retail POS", icon: Store },
  { key: "grocery", label: "Grocery / Supermarket", icon: Scale },
  { key: "wholesale", label: "Wholesale & B2B", icon: Truck },
  { key: "restaurant", label: "Restaurant & Cafe", icon: UtensilsCrossed },
  { key: "pharmacy", label: "Pharmacy & Rx", icon: Pill },
  { key: "salon", label: "Salon & Spa", icon: Scissors },
  { key: "repair", label: "Repair & Service", icon: Wrench },
];

export default function SalesPage() {
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVertical, setSelectedVertical] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeInvoice, setActiveInvoice] = useState<InvoiceData | null>(null);

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const [posSalesRes, directSalesRes] = await Promise.allSettled([
        api.get("/pos/sales"),
        api.get("/sales", { params: { limit: 100 } }),
      ]);

      let items: SaleSummary[] = [];

      if (directSalesRes.status === "fulfilled") {
        const d = (directSalesRes.value.data as any)?.data ?? directSalesRes.value.data ?? [];
        if (Array.isArray(d) && d.length > 0) items = d;
      }

      if (items.length === 0 && posSalesRes.status === "fulfilled") {
        const d = (posSalesRes.value.data as any)?.data ?? posSalesRes.value.data ?? [];
        if (Array.isArray(d)) items = d;
      }

      setSales(items);
    } catch (e) {
      console.error("Failed to load sales:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Helper to infer or return vertical
  const getSaleVertical = (s: SaleSummary): InvoiceVerticalType => {
    if (s.vertical) return s.vertical;
    if (s.tableNo || s.serverName) return "restaurant";
    if (s.doctorName) return "pharmacy";
    if (s.deviceModel) return "repair";
    if (s.challanNo) return "wholesale";
    if (s.invoiceNo?.startsWith("GRO") || s.invoiceNo?.startsWith("SUP")) return "grocery";
    if (s.invoiceNo?.startsWith("WS") || s.invoiceNo?.startsWith("B2B")) return "wholesale";
    if (s.invoiceNo?.startsWith("RES") || s.invoiceNo?.startsWith("KOT")) return "restaurant";
    if (s.invoiceNo?.startsWith("RX") || s.invoiceNo?.startsWith("PHAR")) return "pharmacy";
    if (s.invoiceNo?.startsWith("SAL")) return "salon";
    if (s.invoiceNo?.startsWith("REP") || s.invoiceNo?.startsWith("JOB")) return "repair";
    return "retail";
  };

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const vert = getSaleVertical(s);
      if (selectedVertical !== "ALL" && vert !== selectedVertical) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        s.invoiceNo?.toLowerCase().includes(q) ||
        s.customer?.name?.toLowerCase().includes(q) ||
        s.customer?.phone?.toLowerCase().includes(q) ||
        s.paymentMethod?.toLowerCase().includes(q)
      );
    });
  }, [sales, selectedVertical, searchQuery]);

  const totalRevenue = filteredSales.reduce((s, x) => s + Number(x.total || (x as any).grandTotal || 0), 0);
  const totalPaid = filteredSales.reduce((s, x) => s + Number(x.paidTotal || 0), 0);
  const totalDue = filteredSales.reduce((s, x) => s + Number(x.dueTotal || 0), 0);

  const openInvoiceDetails = async (sale: SaleSummary) => {
    try {
      // If sale doesn't have items populated, fetch full sale details
      let fullSale = sale;
      if (!sale.items || sale.items.length === 0) {
        try {
          const res = await api.get(`/sales/${sale.id}`);
          const fetched = (res.data as any)?.data ?? res.data;
          if (fetched && fetched.id) fullSale = fetched;
        } catch {}
      }

      const vert = getSaleVertical(fullSale);

      const invoicePayload: InvoiceData = {
        id: fullSale.id,
        invoiceNo: fullSale.invoiceNo || `INV-${fullSale.id.slice(0, 8)}`,
        saleDate: fullSale.saleDate || fullSale.createdAt,
        vertical: vert,
        customer: fullSale.customer,
        items: (fullSale.items || []).map((it: any) => ({
          name: it.productName || it.product?.name || it.name || "Item",
          productName: it.productName || it.product?.name || it.name,
          sku: it.sku || it.product?.sku,
          qty: Number(it.qty || it.quantity || 1),
          unitPrice: Number(it.unitPrice || it.price || 0),
          total: Number(it.total || Number(it.qty || 1) * Number(it.unitPrice || 0)),
          uom: it.uom || it.product?.uom,
          weightKg: it.weightKg,
          pluCode: it.pluCode,
          batchNo: it.batchNo,
          expiryDate: it.expiryDate,
          genericName: it.genericName,
          dosage: it.dosage,
          modifiers: it.modifiers,
          stylistName: it.stylistName,
          serviceDuration: it.serviceDuration,
          partWarranty: it.partWarranty,
        })),
        subTotal: fullSale.subTotal || fullSale.total,
        grandTotal: Number(fullSale.total || (fullSale as any).grandTotal || 0),
        paidTotal: Number(fullSale.paidTotal || 0),
        dueTotal: Number(fullSale.dueTotal || 0),
        paymentMethod: fullSale.paymentMethod || "CASH",
        tableNo: fullSale.tableNo,
        serverName: fullSale.serverName,
        doctorName: fullSale.doctorName,
        deviceModel: fullSale.deviceModel,
        challanNo: fullSale.challanNo,
        notes: fullSale.notes,
      };

      setActiveInvoice(invoicePayload);
    } catch (e) {
      console.error("Failed to prepare invoice modal:", e);
    }
  };

  const fmt = (n: number) =>
    `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales & Invoice Management</h1>
          <p className="text-xs text-slate-500">
            Unified multi-vertical sales log with customized thermal & commercial invoice print formats
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/sales/quotations"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <FileText size={14} /> Quotations
          </Link>
          <Link
            href="/sales/orders"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <ClipboardList size={14} /> Sales Orders
          </Link>
          <Link
            href="/pos"
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-sm"
          >
            <ShoppingCart size={14} /> POS Checkout
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Invoiced Sales Volume</span>
            <TrendingUp size={18} className="text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{fmt(totalRevenue)}</p>
          <span className="text-[11px] text-slate-400">{filteredSales.length} Total transactions</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Collected Payments</span>
            <CreditCard size={18} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">{fmt(totalPaid)}</p>
          <span className="text-[11px] text-slate-400">Total tender received</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Customer Due Receivable</span>
            <FileText size={18} className="text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">{fmt(totalDue)}</p>
          <span className="text-[11px] text-slate-400">Uncollected credit balances</span>
        </div>
      </div>

      {/* Vertical POS Type Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {VERTICAL_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isAct = selectedVertical === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedVertical(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isAct
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <TabIcon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Table Container */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden space-y-3">
        {/* Table Search Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice number, client or payment method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs font-semibold focus:border-indigo-500 focus:outline-none focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadSales}
              className="flex items-center gap-1 rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 text-xs font-bold transition"
              title="Refresh sales list"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw size={24} className="mx-auto animate-spin text-slate-300" />
            <p>Loading sales transactions...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <FileText size={40} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No sales transactions found</p>
            <p className="text-xs">Create new sales or checkouts across any POS terminal.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Vertical POS</th>
                  <th className="px-5 py-3.5">Customer / Client</th>
                  <th className="px-5 py-3.5">Date / Time</th>
                  <th className="px-5 py-3.5 text-right">Total (৳)</th>
                  <th className="px-5 py-3.5 text-right">Due (৳)</th>
                  <th className="px-5 py-3.5 text-center">Payment</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Print / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSales.map((s) => {
                  const vert = getSaleVertical(s);
                  const vertConfig = VERTICAL_TABS.find((v) => v.key === vert) || VERTICAL_TABS[1];
                  const VertIcon = vertConfig.icon;
                  const grandAmt = Number(s.total || (s as any).grandTotal || 0);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3 font-mono font-bold text-slate-900">
                        {s.invoiceNo || `INV-${s.id.slice(0, 8)}`}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          <VertIcon size={11} /> {vertConfig.label.split(" ")[0]}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-slate-800">{s.customer?.name || "Walk-in Patron"}</span>
                        {s.customer?.phone && (
                          <span className="block text-[10px] text-slate-400 font-mono">{s.customer.phone}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {new Date(s.saleDate || s.createdAt || Date.now()).toLocaleDateString()}
                        <span className="block text-[10px] text-slate-400">
                          {new Date(s.saleDate || s.createdAt || Date.now()).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-black tabular-nums text-slate-900">
                        {fmt(grandAmt)}
                      </td>
                      <td className="px-5 py-3 text-right font-bold tabular-nums">
                        {Number(s.dueTotal) > 0 ? (
                          <span className="text-amber-600">{fmt(Number(s.dueTotal))}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            PAY_COLOR[s.paymentStatus] ?? "bg-slate-50 text-slate-600"
                          }`}
                        >
                          {s.paymentStatus || s.paymentMethod || "PAID"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            STATUS_COLOR[s.status] ?? "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {s.status || "COMPLETED"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => openInvoiceDetails(s)}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold transition shadow-2xs"
                        >
                          <Printer size={12} /> Invoice Slip
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Universal Multi-Vertical Specialized Invoice & Print Modal */}
      {activeInvoice && (
        <UniversalInvoiceModal
          data={activeInvoice}
          initialVertical={activeInvoice.vertical}
          onClose={() => setActiveInvoice(null)}
        />
      )}
    </div>
  );
}
