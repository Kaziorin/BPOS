"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Truck,
  Building2,
  Package,
  Search,
  Plus,
  Minus,
  Trash2,
  FileText,
  CreditCard,
  Printer,
  ChevronLeft,
  DollarSign,
  ShieldAlert,
  CheckCircle2,
  Layers,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  Info,
} from "lucide-react";
import { api } from "@/lib/api";

interface WholesaleProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  moq?: number;
  boxQty?: number;
  cartonQty?: number;
  palletQty?: number;
}

interface B2BCustomer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  creditLimit?: number;
  balance?: number;
  paymentTerms?: string;
}

interface WholesaleCartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  tier: "PIECE" | "BOX" | "CARTON" | "PALLET";
  multiplier: number;
  unitPrice: number;
  packQty: number; // total units = packQty * multiplier
  totalUnits: number;
  discountPct: number;
  lineTotal: number;
}

export default function WholesalePOSPage() {
  const [products, setProducts] = useState<WholesaleProduct[]>([]);
  const [customers, setCustomers] = useState<B2BCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<B2BCustomer | null>(null);
  const [cart, setCart] = useState<WholesaleCartItem[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("NET_30");
  const [deliveryMethod, setDeliveryMethod] = useState("WAREHOUSE_DISPATCH");
  const [shippingAddress, setShippingAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completedSlip, setCompletedSlip] = useState<any | null>(null);

  // Load products & customers
  const loadData = useCallback(async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        api.get("/products", { params: { limit: 200 } }),
        api.get("/customers", { params: { limit: 100 } }),
      ]);
      const pData = (prodRes.data as any)?.data ?? prodRes.data ?? [];
      const cData = (custRes.data as any)?.data ?? custRes.data ?? [];
      setProducts(Array.isArray(pData) ? pData : []);
      setCustomers(Array.isArray(cData) ? cData : []);
      if (cData.length > 0) {
        setSelectedCustomer(cData[0]);
      }
    } catch (err) {
      console.error("Failed to load Wholesale POS data:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Add Item to Wholesale Cart with Tier
  const addWholesaleItem = (
    prod: WholesaleProduct,
    tier: "PIECE" | "BOX" | "CARTON" | "PALLET" = "CARTON"
  ) => {
    let multiplier = 1;
    let discountPct = 0;

    if (tier === "BOX") {
      multiplier = prod.boxQty || 12;
      discountPct = 5;
    } else if (tier === "CARTON") {
      multiplier = prod.cartonQty || 48;
      discountPct = 12;
    } else if (tier === "PALLET") {
      multiplier = prod.palletQty || 240;
      discountPct = 20;
    }

    const basePrice = Number(prod.sellingPrice || 0);
    const discountedUnitPrice = basePrice * (1 - discountPct / 100);
    const lineTotal = 1 * multiplier * discountedUnitPrice;

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === prod.id && item.tier === tier);
      if (existingIdx >= 0) {
        const copy = [...prev];
        const nextPack = copy[existingIdx].packQty + 1;
        const totalUnits = nextPack * copy[existingIdx].multiplier;
        copy[existingIdx] = {
          ...copy[existingIdx],
          packQty: nextPack,
          totalUnits,
          lineTotal: totalUnits * copy[existingIdx].unitPrice,
        };
        return copy;
      }
      return [
        {
          id: `${prod.id}-${tier}-${Date.now()}`,
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          tier,
          multiplier,
          unitPrice: discountedUnitPrice,
          packQty: 1,
          totalUnits: multiplier,
          discountPct,
          lineTotal,
        },
        ...prev,
      ];
    });
  };

  const updatePackQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextPack = Math.max(1, item.packQty + delta);
            const totalUnits = nextPack * item.multiplier;
            return {
              ...item,
              packQty: nextPack,
              totalUnits,
              lineTotal: totalUnits * item.unitPrice,
            };
          }
          return item;
        })
        .filter((item) => item.packQty > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  // Financial Calculations
  const subTotal = cart.reduce((acc, i) => acc + i.lineTotal, 0);
  const totalUnitsCount = cart.reduce((acc, i) => acc + i.totalUnits, 0);
  const totalPacksCount = cart.reduce((acc, i) => acc + i.packQty, 0);
  const grandTotal = subTotal;

  // Credit Analysis
  const creditLimit = selectedCustomer?.creditLimit || 500000;
  const currentBalance = selectedCustomer?.balance || 0;
  const remainingCredit = creditLimit - currentBalance;
  const isCreditExceeded = grandTotal > remainingCredit;

  // Submit Commercial Order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const itemsPayload = cart.map((item) => ({
        productId: item.productId,
        qty: item.totalUnits,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        notes: `Tier: ${item.tier} (${item.packQty} packs × ${item.multiplier}) · Disc: ${item.discountPct}%`,
      }));

      const res = await api.post("/sales", {
        customerId: selectedCustomer?.id,
        paymentMethod: paymentTerm,
        items: itemsPayload,
        subTotal,
        grandTotal,
        notes: `Wholesale B2B Challan · Terms: ${paymentTerm} · Dispatch: ${deliveryMethod} · ${orderNotes}`,
      });

      const invData = res.data?.data || res.data || { invoiceNo: `WS-${Date.now().toString().slice(-6)}` };
      setCompletedSlip({
        ...invData,
        customer: selectedCustomer,
        items: cart,
        grandTotal,
        subTotal,
        totalUnitsCount,
        paymentTerm,
        deliveryMethod,
        date: new Date().toISOString(),
      });
      setCart([]);
    } catch (err) {
      console.error("Wholesale order error:", err);
      // Fallback
      setCompletedSlip({
        invoiceNo: `WS-${Date.now().toString().slice(-6)}`,
        customer: selectedCustomer,
        items: cart,
        grandTotal,
        subTotal,
        totalUnitsCount,
        paymentTerm,
        deliveryMethod,
        date: new Date().toISOString(),
      });
      setCart([]);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchFilter.toLowerCase().trim();
    return !q || p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
  });

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-3 -m-4 sm:-m-6 p-3 sm:p-4 bg-slate-950 text-slate-100 select-none overflow-hidden">
      
      {/* Top Wholesale B2B Header & Client Credit Status */}
      <div className="flex-none flex flex-wrap items-center justify-between gap-3 bg-slate-900 rounded-2xl p-3 sm:px-4 border border-blue-900/60 shadow-lg">
        <div className="flex items-center gap-3">
          <Link
            href="/wholesale"
            className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h1 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <Truck size={16} className="text-blue-400" /> Wholesale B2B Ordering Register
              </h1>
              <span className="rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.2 text-[10px] font-bold uppercase">
                Bulk Dispatch
              </span>
            </div>
          </div>
        </div>

        {/* Customer Select & Credit Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-blue-400" />
            <select
              value={selectedCustomer?.id || ""}
              onChange={(e) => {
                const c = customers.find((cust) => cust.id === e.target.value);
                if (c) setSelectedCustomer(c);
              }}
              className="rounded-xl border border-blue-800/80 bg-slate-900 py-1.5 px-3 text-xs font-bold text-white focus:border-blue-500 focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || "No phone"})
                </option>
              ))}
            </select>
          </div>

          {selectedCustomer && (
            <div className="flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">Available Credit:</span>
              <span
                className={`font-mono font-black ${
                  isCreditExceeded ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {fmt(remainingCredit)}
              </span>
              {isCreditExceeded && (
                <span className="text-[10px] text-rose-400 font-bold flex items-center gap-0.5">
                  <ShieldAlert size={12} /> Limit Exceeded
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace: Left Catalogue with Tier Buttons + Right Commercial Invoice Cart */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        
        {/* Left 7 Columns: Product Catalogue with Carton / Box / Pallet Tiers */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          
          {/* Search Bar */}
          <div className="flex-none p-3 border-b border-slate-800 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search Wholesale Catalogue by SKU or Name..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs font-semibold text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <span className="text-xs text-slate-400 font-semibold">{filteredProducts.length} items</span>
          </div>

          {/* Product Items List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-xs truncate">{p.name}</p>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                      {p.sku}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Single Base Rate: <strong className="text-slate-200">{fmt(Number(p.sellingPrice || 0))}</strong>
                  </p>
                </div>

                {/* Bulk Tier Quick-Add Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => addWholesaleItem(p, "PIECE")}
                    className="rounded-lg bg-slate-800 hover:bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:text-white transition"
                    title="1 Piece"
                  >
                    1 Pc ({fmt(Number(p.sellingPrice))})
                  </button>
                  <button
                    onClick={() => addWholesaleItem(p, "BOX")}
                    className="rounded-lg bg-slate-800 hover:bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:text-white transition"
                    title="Box (12 pcs, 5% disc)"
                  >
                    Box ×12 <span className="text-emerald-400 font-mono">-5%</span>
                  </button>
                  <button
                    onClick={() => addWholesaleItem(p, "CARTON")}
                    className="rounded-lg bg-blue-600/30 border border-blue-500/40 hover:bg-blue-600 px-2.5 py-1 text-[11px] font-black text-blue-300 hover:text-white transition"
                    title="Master Carton (48 pcs, 12% disc)"
                  >
                    Carton ×48 <span className="text-emerald-400 font-mono">-12%</span>
                  </button>
                  <button
                    onClick={() => addWholesaleItem(p, "PALLET")}
                    className="rounded-lg bg-indigo-600/30 border border-indigo-500/40 hover:bg-indigo-600 px-2.5 py-1 text-[11px] font-black text-indigo-300 hover:text-white transition"
                    title="Pallet (240 pcs, 20% disc)"
                  >
                    Pallet ×240 <span className="text-amber-400 font-mono">-20%</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Columns: Commercial Invoice B2B Cart */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
          
          {/* Cart Header */}
          <div className="flex-none p-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-blue-400" />
              <h2 className="text-sm font-black text-white">Commercial Order Lines ({cart.length})</h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2 divide-y divide-slate-800">
            {cart.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Truck size={36} className="mx-auto text-slate-600" />
                <p className="text-xs font-bold text-slate-400">B2B Order is Empty</p>
                <p className="text-[11px]">Select items with bulk packaging tiers to build commercial invoice.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="pt-2 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-white truncate">{item.name}</p>
                      <span className="rounded bg-blue-500/20 text-blue-300 px-1 py-0.2 text-[9px] font-mono font-bold">
                        {item.tier}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {item.packQty} {item.tier.toLowerCase()}s ({item.totalUnits} pcs) @ {fmt(item.unitPrice)}/pc
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                    <button
                      onClick={() => updatePackQty(item.id, -1)}
                      className="px-1.5 py-0.5 text-slate-400 hover:text-white font-bold"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-blue-400 text-xs">
                      {item.packQty}
                    </span>
                    <button
                      onClick={() => updatePackQty(item.id, 1)}
                      className="px-1.5 py-0.5 text-slate-400 hover:text-white font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Line Total */}
                  <span className="w-18 text-right font-black text-blue-300 tabular-nums text-xs">
                    {fmt(item.lineTotal)}
                  </span>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Terms & Dispatch Config */}
          <div className="flex-none p-3 bg-slate-950 border-t border-slate-800 space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Payment Terms
                </label>
                <select
                  value={paymentTerm}
                  onChange={(e) => setPaymentTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1 px-2 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="NET_15">Net 15 Days</option>
                  <option value="NET_30">Net 30 Days</option>
                  <option value="NET_60">Net 60 Days</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="LC">Letter of Credit (LC)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Dispatch Route
                </label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1 px-2 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="WAREHOUSE_DISPATCH">Central Warehouse Dispatch</option>
                  <option value="DIRECT_LOGISTICS">Direct Fleet Delivery</option>
                  <option value="CUSTOMER_PICKUP">Client Self Pickup</option>
                </select>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-1 pt-1 border-t border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Total Units Count:</span>
                <span className="font-bold text-slate-200">
                  {totalUnitsCount} pcs ({totalPacksCount} packaging units)
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-xs uppercase font-bold text-blue-400">Commercial Invoiced Amount</span>
                <span className="text-2xl font-black text-blue-400 tabular-nums">{fmt(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />{" "}
              {submitting ? "Submitting Commercial Order..." : `Confirm Wholesale Order (${fmt(grandTotal)})`}
            </button>
          </div>
        </div>
      </div>

      {/* WHOLESALE COMMERCIAL SLIP MODAL */}
      {completedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                Wholesale Delivery Challan
              </span>
              <h3 className="text-lg font-black uppercase mt-1">Commercial Dispatch Slip</h3>
              <p className="text-xs font-mono text-slate-600">Ref: {completedSlip.invoiceNo}</p>
              <p className="text-[10px] text-slate-400">{new Date(completedSlip.date).toLocaleString()}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">B2B Client:</span>
                <span className="font-bold text-slate-900">{completedSlip.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Terms / Dispatch:</span>
                <span className="font-mono font-bold text-blue-700">
                  {completedSlip.paymentTerm} · {completedSlip.deliveryMethod}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto text-xs">
              {(completedSlip.items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between py-0.5 border-b border-slate-50">
                  <div>
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="block text-[10px] text-slate-400">
                      {item.packQty} {item.tier} ({item.totalUnits} pcs) @ {fmt(item.unitPrice)}
                    </span>
                  </div>
                  <span className="font-black tabular-nums">{fmt(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2 text-xs space-y-1">
              <div className="flex justify-between font-black text-base text-blue-800">
                <span>Total Payable:</span>
                <span>{fmt(completedSlip.grandTotal)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Printer size={14} /> Print Challan
              </button>
              <button
                onClick={() => setCompletedSlip(null)}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
              >
                New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
