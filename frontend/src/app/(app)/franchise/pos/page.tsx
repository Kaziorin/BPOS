"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Store,
  Search,
  Plus,
  Trash2,
  Receipt,
  Printer,
  ChevronLeft,
  DollarSign,
  CheckCircle2,
  Percent,
  TrendingUp,
  FileText,
  Truck,
} from "lucide-react";
import { api } from "@/lib/api";

interface FranchiseOutlet {
  id: string;
  name: string;
  code: string;
  ownerName: string;
  royaltyPct: number;
  marketingFeePct: number;
  location: string;
}

interface FranchiseCatalogItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  franchisePrice: number;
  mrp: number;
}

interface FranchiseCartLine {
  id: string;
  productId: string;
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  mrp: number;
  lineTotal: number;
}

const DEFAULT_OUTLETS: FranchiseOutlet[] = [
  { id: "FR-01", name: "Dhanmondi Flagship Outlet", code: "DMD-01", ownerName: "Azizul Huq", royaltyPct: 6, marketingFeePct: 2, location: "Dhanmondi 27" },
  { id: "FR-02", name: "Uttara Sector 3 Branch", code: "UTT-02", ownerName: "Tanvir Ahmed", royaltyPct: 6, marketingFeePct: 2, location: "Uttara Rabindra Sarani" },
  { id: "FR-03", name: "Gulshan 2 Express Outlet", code: "GUL-03", ownerName: "Sabrina Rashid", royaltyPct: 7, marketingFeePct: 2, location: "Gulshan Avenue" },
  { id: "FR-04", name: "Chittagong GEC Circle Store", code: "CTG-04", ownerName: "Kamrul Hasan", royaltyPct: 5, marketingFeePct: 2, location: "GEC Circle, CTG" },
];

export default function FranchisePOSPage() {
  const [outlets, setOutlets] = useState<FranchiseOutlet[]>(DEFAULT_OUTLETS);
  const [selectedOutlet, setSelectedOutlet] = useState<FranchiseOutlet>(DEFAULT_OUTLETS[0]);
  const [catalog, setCatalog] = useState<FranchiseCatalogItem[]>([]);
  const [cart, setCart] = useState<FranchiseCartLine[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completedTransfer, setCompletedTransfer] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get("/products", { params: { limit: 100 } });
      const pData = (res.data as any)?.data ?? res.data ?? [];
      setCatalog(
        Array.isArray(pData) && pData.length > 0
          ? pData.map((p: any) => ({
              id: p.id,
              name: p.name,
              sku: p.sku || "FR-ITEM",
              category: p.category?.name || "Standard Supply",
              franchisePrice: Number(p.costPrice ? p.costPrice * 1.15 : p.sellingPrice * 0.7),
              mrp: Number(p.sellingPrice || 1000),
            }))
          : [
              { id: "F1", name: "Brand Standard Raw Material Mix (25kg)", sku: "FR-MIX-25", category: "Raw Ingredients", franchisePrice: 3200, mrp: 4500 },
              { id: "F2", name: "Official Branded Packaging Boxes (Pack of 500)", sku: "FR-BOX-500", category: "Packaging", franchisePrice: 2400, mrp: 3000 },
              { id: "F3", name: "Signature Sauce Concentrate (10L)", sku: "FR-SAUCE-10", category: "Sauces & Condiments", franchisePrice: 1800, mrp: 2500 },
              { id: "F4", name: "Uniform Shirts & Aprons (Set of 5)", sku: "FR-UNIFORM-5", category: "Merchandise", franchisePrice: 3500, mrp: 4000 },
            ]
      );
    } catch (err) {
      console.error("Failed to load franchise catalog:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const addToCart = (item: FranchiseCatalogItem) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === item.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].qty += 1;
        copy[existingIdx].lineTotal = copy[existingIdx].qty * copy[existingIdx].unitPrice;
        return copy;
      }
      return [
        {
          id: `${item.id}-${Date.now()}`,
          productId: item.id,
          name: item.name,
          sku: item.sku,
          qty: 1,
          unitPrice: item.franchisePrice,
          mrp: item.mrp,
          lineTotal: item.franchisePrice,
        },
        ...prev,
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = Math.max(1, item.qty + delta);
            return {
              ...item,
              qty: nextQty,
              lineTotal: nextQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeLine = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const subTotal = cart.reduce((acc, i) => acc + i.lineTotal, 0);
  const royaltyDeduction = (subTotal * selectedOutlet.royaltyPct) / 100;
  const marketingLevy = (subTotal * selectedOutlet.marketingFeePct) / 100;
  const totalSupplyInvoice = subTotal;

  const handleCreateRequisition = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const itemsPayload = cart.map((i) => ({
        productId: i.productId,
        qty: i.qty,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
        notes: `Franchise Order for ${selectedOutlet.name} (${selectedOutlet.code})`,
      }));

      const res = await api.post("/sales", {
        customerName: `${selectedOutlet.name} (${selectedOutlet.ownerName})`,
        paymentMethod: "FRANCHISE_CLEARING",
        items: itemsPayload,
        subTotal,
        grandTotal: totalSupplyInvoice,
        notes: `Franchise Requisition · Store: ${selectedOutlet.name} · Royalty Split: ${selectedOutlet.royaltyPct}% · Marketing: ${selectedOutlet.marketingFeePct}%`,
      });

      const invData = res.data?.data || res.data || { invoiceNo: `FRQ-${Date.now().toString().slice(-6)}` };
      setCompletedTransfer({
        ...invData,
        outlet: selectedOutlet,
        items: cart,
        subTotal,
        royaltyDeduction,
        marketingLevy,
        totalSupplyInvoice,
        date: new Date().toISOString(),
      });
      setCart([]);
    } catch (err) {
      setCompletedTransfer({
        invoiceNo: `FRQ-${Date.now().toString().slice(-6)}`,
        outlet: selectedOutlet,
        items: cart,
        subTotal,
        royaltyDeduction,
        marketingLevy,
        totalSupplyInvoice,
        date: new Date().toISOString(),
      });
      setCart([]);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCatalog = catalog.filter((c) => {
    const q = searchFilter.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || c.sku.toLowerCase().includes(q);
  });

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-3 -m-4 sm:-m-6 p-3 sm:p-4 bg-slate-950 text-slate-100 select-none overflow-hidden">
      
      {/* Top Franchise Header */}
      <div className="flex-none flex flex-wrap items-center justify-between gap-3 bg-slate-900 rounded-2xl p-3 sm:px-4 border border-violet-900/60 shadow-lg">
        <div className="flex items-center gap-3">
          <Link
            href="/franchise"
            className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-violet-500 animate-pulse" />
              <h1 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <Store size={16} className="text-violet-400" /> Franchise Multi-Unit Requisition & POS
              </h1>
              <span className="rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.2 text-[10px] font-bold uppercase">
                Central Headquarters
              </span>
            </div>
          </div>
        </div>

        {/* Outlet Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold">Select Outlet:</span>
          <select
            value={selectedOutlet.id}
            onChange={(e) => {
              const o = outlets.find((x) => x.id === e.target.value);
              if (o) setSelectedOutlet(o);
            }}
            className="rounded-xl border border-violet-800 bg-slate-900 py-1.5 px-3 text-xs font-bold text-white focus:border-violet-500 focus:outline-none"
          >
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Workspace: Left Central Brand Catalogue + Right Requisition & Royalty Slip */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        
        {/* Left 7 Columns: Central Catalog */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex-none p-3 border-b border-slate-800">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search Central Headquarters Brand Supplies..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs font-semibold text-slate-200 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
            {filteredCatalog.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-violet-500/60 transition flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-xs truncate">{item.name}</p>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                      {item.sku}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Category: <span className="text-violet-300 font-semibold">{item.category}</span> · Retail MRP: {fmt(item.mrp)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-black text-violet-400">{fmt(item.franchisePrice)}</span>
                    <span className="block text-[9px] text-slate-400">Franchise Supply Rate</span>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="rounded-xl bg-violet-600/30 border border-violet-500/40 hover:bg-violet-600 px-3 py-1.5 text-xs font-black text-violet-300 hover:text-white transition"
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Columns: Outlet Requisition & Royalty Breakdown */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
          <div className="flex-none p-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-white">{selectedOutlet.name}</h2>
              <span className="text-[10px] text-slate-400 font-mono">Location: {selectedOutlet.location}</span>
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-[11px] font-bold text-rose-400">
                Clear
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-1.5 divide-y divide-slate-800">
            {cart.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Store size={36} className="mx-auto text-slate-600" />
                <p className="text-xs font-bold text-slate-400">Requisition Cart is Empty</p>
                <p className="text-[11px]">Select brand supplies to order from headquarters.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="pt-1.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white truncate">{item.name}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.qty} units @ {fmt(item.unitPrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                    <button onClick={() => updateQty(item.id, -1)} className="px-1 text-slate-400 font-bold">
                      −
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-violet-400 text-xs">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="px-1 text-slate-400 font-bold">
                      +
                    </button>
                  </div>

                  <span className="w-16 text-right font-black text-violet-300 tabular-nums text-xs">
                    {fmt(item.lineTotal)}
                  </span>

                  <button onClick={() => removeLine(item.id)} className="text-slate-500 hover:text-rose-400 p-1">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Royalty Calculation & Requisition Action */}
          <div className="flex-none p-3.5 bg-slate-950 border-t border-slate-800 space-y-2.5 text-xs">
            <div className="space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>Supply Subtotal:</span>
                <span className="text-slate-200 font-bold">{fmt(subTotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Royalty Split ({selectedOutlet.royaltyPct}%):</span>
                <span>{fmt(royaltyDeduction)}</span>
              </div>
              <div className="flex justify-between text-blue-400">
                <span>Marketing Fund ({selectedOutlet.marketingFeePct}%):</span>
                <span>{fmt(marketingLevy)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-slate-800">
                <span className="text-xs uppercase font-bold text-violet-400">Total Supply Invoice</span>
                <span className="text-2xl font-black text-violet-400 tabular-nums">{fmt(totalSupplyInvoice)}</span>
              </div>
            </div>

            <button
              onClick={handleCreateRequisition}
              disabled={cart.length === 0 || submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-black text-white shadow-lg shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> Complete Franchise Requisition ({fmt(totalSupplyInvoice)})
            </button>
          </div>
        </div>
      </div>

      {/* FRANCHISE TRANSFER SLIP MODAL */}
      {completedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-900 bg-violet-100 px-2 py-0.5 rounded-full">
                HQ Franchise Transfer Invoice
              </span>
              <h3 className="text-lg font-black uppercase mt-1">Inter-Store Supply Slip</h3>
              <p className="text-xs font-mono text-slate-600">Requisition #: {completedTransfer.invoiceNo}</p>
              <p className="text-[10px] text-slate-400">{new Date(completedTransfer.date).toLocaleString()}</p>
            </div>

            <div className="p-3 bg-violet-50/60 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Destination Outlet:</span>
                <span className="font-bold text-slate-900">{completedTransfer.outlet?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Franchisee Owner:</span>
                <span className="font-bold text-slate-800">{completedTransfer.outlet?.ownerName}</span>
              </div>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto text-xs">
              {(completedTransfer.items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between py-0.5 border-b border-slate-50">
                  <div>
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="block text-[10px] text-slate-400">
                      {item.qty} units × {fmt(item.unitPrice)}
                    </span>
                  </div>
                  <span className="font-black tabular-nums">{fmt(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2 text-xs space-y-1">
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Royalty Ledger Accrual ({completedTransfer.outlet?.royaltyPct}%):</span>
                <span>{fmt(completedTransfer.royaltyDeduction)}</span>
              </div>
              <div className="flex justify-between font-black text-base text-violet-900 pt-1">
                <span>Total Invoice Settled:</span>
                <span>{fmt(completedTransfer.totalSupplyInvoice)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Printer size={14} /> Print Transfer Invoice
              </button>
              <button
                onClick={() => setCompletedTransfer(null)}
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-700"
              >
                New Requisition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
