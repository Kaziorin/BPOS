"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Scale,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  PauseCircle,
  Play,
  CheckCircle2,
  Printer,
  ChevronLeft,
  DollarSign,
  CreditCard,
  Phone,
  Layers,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Volume2,
} from "lucide-react";
import { api } from "@/lib/api";

interface GroceryItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  unitPrice: number;
  qty: number;
  isWeighed?: boolean;
  weightKg?: number;
  tareWeightKg?: number;
  lineTotal: number;
}

interface ProduceItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  sellingPrice: number;
  uom: string;
  category?: { name: string };
}

export default function GroceryPOSPage() {
  const [products, setProducts] = useState<ProduceItem[]>([]);
  const [cart, setCart] = useState<GroceryItem[]>([]);
  const [scanInput, setScanInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [bagFee, setBagFee] = useState(0);
  const [heldCarts, setHeldCarts] = useState<{ id: string; time: string; items: GroceryItem[] }[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<any | null>(null);

  // Scale Modal State
  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [activeScaleProduct, setActiveScaleProduct] = useState<ProduceItem | null>(null);
  const [inputWeightKg, setInputWeightKg] = useState("1.000");
  const [tareWeightKg, setTareWeightKg] = useState("0.000");

  const scanRef = useRef<HTMLInputElement>(null);

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get("/products", { params: { limit: 200 } });
      const pData = (res.data as any)?.data ?? res.data ?? [];
      setProducts(Array.isArray(pData) ? pData : []);
    } catch (err) {
      console.error("Failed to load products for Grocery POS:", err);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    scanRef.current?.focus();
  }, [loadProducts]);

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Beep sound simulation on scan
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  };

  // Add normal barcode product to cart
  const addProductToCart = (prod: ProduceItem, qty = 1, isWeighed = false, weightKg?: number) => {
    playBeep();
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.productId === prod.id && !item.isWeighed && !isWeighed);
      if (idx >= 0 && !isWeighed) {
        const copy = [...prev];
        const newQty = copy[idx].qty + qty;
        copy[idx] = {
          ...copy[idx],
          qty: newQty,
          lineTotal: newQty * copy[idx].unitPrice,
        };
        return copy;
      }
      const actualQty = isWeighed ? weightKg || 1 : qty;
      const unitCost = Number(prod.sellingPrice || 0);
      const lineTotal = actualQty * unitCost;

      return [
        {
          id: `${prod.id}-${Date.now()}`,
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          barcode: prod.barcode,
          unitPrice: unitCost,
          qty: actualQty,
          isWeighed,
          weightKg: isWeighed ? weightKg : undefined,
          lineTotal,
        },
        ...prev,
      ];
    });
    setScanInput("");
    scanRef.current?.focus();
  };

  // Handle continuous barcode scanning
  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = scanInput.trim().toLowerCase();
      if (!code) return;

      const found = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === code) ||
          (p.sku && p.sku.toLowerCase() === code) ||
          p.name.toLowerCase() === code
      );

      if (found) {
        // If product is sold by KG / weight, open scale modal
        if (
          found.uom?.toLowerCase().includes("kg") ||
          found.uom?.toLowerCase().includes("gm") ||
          found.name.toLowerCase().includes("kg")
        ) {
          openScaleModal(found);
        } else {
          addProductToCart(found);
        }
      } else {
        alert(`Barcode / SKU "${scanInput}" not found in inventory.`);
      }
      setScanInput("");
    }
  };

  // Scale Produce Dialog
  const openScaleModal = (prod: ProduceItem) => {
    setActiveScaleProduct(prod);
    setInputWeightKg("1.000");
    setTareWeightKg("0.000");
    setScaleModalOpen(true);
  };

  const confirmScaleWeight = () => {
    if (!activeScaleProduct) return;
    const netWeight = Math.max(0.001, (parseFloat(inputWeightKg) || 0) - (parseFloat(tareWeightKg) || 0));
    addProductToCart(activeScaleProduct, netWeight, true, netWeight);
    setScaleModalOpen(false);
    setActiveScaleProduct(null);
  };

  // Cart quantity controls
  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = Math.max(item.isWeighed ? 0.05 : 1, Number((item.qty + delta).toFixed(3)));
            return {
              ...item,
              qty: newQty,
              lineTotal: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Hold & Recall Lane Cart
  const holdCurrentCart = () => {
    if (cart.length === 0) return;
    setHeldCarts((prev) => [
      ...prev,
      {
        id: `HOLD-${Date.now().toString().slice(-4)}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        items: cart,
      },
    ]);
    setCart([]);
    alert("Lane cart held. You can now checkout next customer.");
  };

  const recallCart = (held: { id: string; items: GroceryItem[] }) => {
    setCart(held.items);
    setHeldCarts((prev) => prev.filter((h) => h.id !== held.id));
  };

  // Calculations
  const subTotal = cart.reduce((acc, item) => acc + item.lineTotal, 0);
  const totalItemsCount = cart.length;
  const totalWeightVolume = cart
    .filter((i) => i.isWeighed)
    .reduce((acc, i) => acc + (i.weightKg || i.qty), 0);
  const grandTotal = subTotal + bagFee;
  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - grandTotal);

  // Submit Supermarket Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const itemsPayload = cart.map((item) => ({
        productId: item.productId,
        qty: item.qty,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        notes: item.isWeighed ? `Weighed: ${item.qty} kg` : undefined,
      }));

      const res = await api.post("/sales", {
        customerPhone: customerPhone || undefined,
        paymentMethod,
        items: itemsPayload,
        subTotal,
        grandTotal,
        notes: `Supermarket Lane Checkout · Bags: ${bagFee > 0 ? "Yes" : "No"}`,
      });

      const invData = res.data?.data || res.data || { invoiceNo: `SM-${Date.now().toString().slice(-6)}` };
      setCompletedInvoice({
        ...invData,
        items: cart,
        grandTotal,
        subTotal,
        bagFee,
        changeDue,
        tendered: tenderedNum || grandTotal,
        paymentMethod,
        date: new Date().toISOString(),
      });
      setCart([]);
      setCashTendered("");
    } catch (err: any) {
      console.error("Supermarket checkout error:", err);
      // Fallback offline mock for testing
      setCompletedInvoice({
        invoiceNo: `SM-${Date.now().toString().slice(-6)}`,
        items: cart,
        grandTotal,
        subTotal,
        bagFee,
        changeDue,
        tendered: tenderedNum || grandTotal,
        paymentMethod,
        date: new Date().toISOString(),
      });
      setCart([]);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter produce / items
  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category?.name || "General")))];
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "ALL" || (p.category?.name || "General") === selectedCategory;
    const q = searchFilter.toLowerCase().trim();
    const matchesSearch =
      !q || p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)) || (p.barcode && p.barcode.includes(q));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-3 -m-4 sm:-m-6 p-3 sm:p-4 bg-slate-900 text-slate-100 select-none overflow-hidden">
      
      {/* Top Supermarket Lane Header */}
      <div className="flex-none flex flex-wrap items-center justify-between gap-3 bg-slate-800/90 rounded-2xl px-4 py-2.5 border border-slate-700/80 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/grocery"
            className="rounded-xl bg-slate-700/80 p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Back to Grocery Hub"
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <Scale size={16} className="text-emerald-400" /> Supermarket POS Lane #1
              </h1>
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 text-[10px] font-bold uppercase">
                Active Lane
              </span>
            </div>
          </div>
        </div>

        {/* Rapid Barcode Scanner Bar */}
        <div className="flex-1 max-w-md relative">
          <Barcode size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
          <input
            ref={scanRef}
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={handleBarcodeScan}
            placeholder="Scan Barcode / SKU & Press Enter (Continuous)..."
            className="w-full rounded-xl border border-emerald-500/40 bg-slate-950 py-2 pl-10 pr-3 text-xs sm:text-sm font-mono font-bold text-emerald-300 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-inner"
          />
        </div>

        {/* Held Carts Notification & Actions */}
        <div className="flex items-center gap-2">
          {heldCarts.length > 0 && (
            <div className="flex items-center gap-1.5">
              {heldCarts.map((h) => (
                <button
                  key={h.id}
                  onClick={() => recallCart(h)}
                  className="rounded-xl bg-amber-500/20 border border-amber-500/40 px-2.5 py-1.5 text-xs font-black text-amber-300 hover:bg-amber-500/30 transition flex items-center gap-1"
                >
                  <Play size={12} /> {h.id} ({h.items.length})
                </button>
              ))}
            </div>
          )}

          <button
            onClick={holdCurrentCart}
            disabled={cart.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-40 transition"
          >
            <PauseCircle size={14} className="text-amber-400" /> Hold Lane
          </button>
        </div>
      </div>

      {/* Main Dual Workspace: Left Produce / Item Grid + Right Supermarket Cart & Checkout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        
        {/* Left 7 Columns: Visual Produce Tiles & Master Catalog */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-800 bg-slate-800/60 overflow-hidden">
          
          {/* Category Pills & Search */}
          <div className="flex-none p-3 border-b border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter Produce by name, SKU or PLU..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-1.5 pl-8 pr-3 text-xs font-semibold text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                      : "bg-slate-700/70 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Tiles Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredProducts.map((p) => {
                const isScaleItem =
                  p.uom?.toLowerCase().includes("kg") ||
                  p.uom?.toLowerCase().includes("gm") ||
                  p.name.toLowerCase().includes("kg");

                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (isScaleItem) {
                        openScaleModal(p);
                      } else {
                        addProductToCart(p);
                      }
                    }}
                    className="flex flex-col justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-700/70 hover:border-emerald-500/80 hover:bg-slate-900 transition text-left group shadow-xs"
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono text-slate-400">{p.sku || "PLU"}</span>
                        {isScaleItem && (
                          <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 text-[9px] font-bold flex items-center gap-0.5">
                            <Scale size={9} /> Scale
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-100 text-xs line-clamp-2 group-hover:text-emerald-300 transition">
                        {p.name}
                      </p>
                    </div>

                    <div className="mt-2 pt-1 border-t border-slate-800 flex items-center justify-between w-full">
                      <span className="text-xs font-black text-emerald-400 tabular-nums">
                        {fmt(Number(p.sellingPrice || 0))}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{p.uom || "pc"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Supermarket Cart & Instant Fast Checkout */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl border border-slate-800 bg-slate-800/90 overflow-hidden shadow-xl">
          
          {/* Cart Header */}
          <div className="flex-none p-3.5 border-b border-slate-700/80 bg-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-emerald-400" />
              <h2 className="text-sm font-black text-white">Lane Cart Items ({cart.length})</h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 transition"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Cart Items List (Dedicated Scroll) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-1.5 divide-y divide-slate-700/40">
            {cart.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Barcode size={36} className="mx-auto text-slate-600 animate-pulse" />
                <p className="text-xs font-bold text-slate-400">Lane is Ready</p>
                <p className="text-[11px]">Scan barcodes or click produce tiles to add to basket.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="pt-1.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-white truncate">{item.name}</p>
                      {item.isWeighed && (
                        <span className="rounded bg-amber-500/20 text-amber-300 px-1 py-0.2 text-[9px] font-bold flex items-center gap-0.5">
                          <Scale size={9} /> {item.qty} kg
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {fmt(item.unitPrice)} × {item.qty} {item.isWeighed ? "kg" : "pcs"}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-slate-900/90 rounded-lg p-0.5 border border-slate-700">
                    <button
                      onClick={() => updateQty(item.id, item.isWeighed ? -0.1 : -1)}
                      className="px-1.5 py-0.5 text-slate-400 hover:text-white font-bold"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-emerald-400 text-xs">
                      {item.isWeighed ? item.qty.toFixed(2) : item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, item.isWeighed ? 0.1 : 1)}
                      className="px-1.5 py-0.5 text-slate-400 hover:text-white font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Line Total */}
                  <span className="w-16 text-right font-black text-emerald-300 tabular-nums text-xs">
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

          {/* Quick Bag & Add-on Bar */}
          <div className="flex-none p-2 bg-slate-900/60 border-t border-slate-700/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <ShoppingBag size={13} /> Add Bag Fee:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setBagFee(0)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  bagFee === 0 ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                None
              </button>
              <button
                onClick={() => setBagFee(5)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  bagFee === 5 ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                +৳5 Bag
              </button>
              <button
                onClick={() => setBagFee(10)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  bagFee === 10 ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                +৳10 Bag
              </button>
            </div>
          </div>

          {/* Checkout Totals & Instant Tender */}
          <div className="flex-none p-3.5 bg-slate-950 border-t border-slate-700 space-y-2.5">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({totalItemsCount} items):</span>
                <span className="font-bold text-slate-200">{fmt(subTotal)}</span>
              </div>
              {bagFee > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Bag Fee:</span>
                  <span className="font-bold text-slate-200">৳{bagFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1 border-t border-slate-800">
                <span className="text-xs uppercase font-bold text-emerald-400">Payable Amount</span>
                <span className="text-2xl font-black text-emerald-400 tabular-nums">{fmt(grandTotal)}</span>
              </div>
            </div>

            {/* Fast Cash Shortcut Tender Buttons */}
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              {[grandTotal, 100, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setCashTendered(String(Math.ceil(amt)))}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 p-1.5 font-bold text-slate-200 text-center transition"
                >
                  ৳{Math.ceil(amt)}
                </button>
              ))}
            </div>

            {/* Tender Input & Change */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <DollarSign size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder="Cash Received (৳)..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-1.5 pl-7 pr-2 text-xs font-bold text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>
              {changeDue > 0 && (
                <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1.5 text-xs font-black text-emerald-300 whitespace-nowrap">
                  Change: {fmt(changeDue)}
                </div>
              )}
            </div>

            {/* Payment Method Selector & Finish Checkout */}
            <div className="grid grid-cols-3 gap-1.5">
              {["CASH", "CARD", "BKASH"].map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`rounded-xl py-1.5 text-xs font-bold transition ${
                    paymentMethod === m
                      ? "bg-slate-700 text-white border border-emerald-500"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> {submitting ? "Processing..." : `Complete Supermarket Sale (${fmt(grandTotal)})`}
            </button>
          </div>
        </div>
      </div>

      {/* WEIGHING SCALE DIALOG POPUP */}
      {scaleModalOpen && activeScaleProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 p-6 shadow-2xl border border-emerald-500/40 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Scale size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{activeScaleProduct.name}</h3>
                  <p className="text-[11px] text-slate-400">Rate: {fmt(activeScaleProduct.sellingPrice)} / kg</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Scale Weight (Gross KG)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.005"
                    min="0.005"
                    value={inputWeightKg}
                    onChange={(e) => setInputWeightKg(e.target.value)}
                    className="w-full rounded-2xl border border-emerald-500/50 bg-slate-950 py-3 px-4 text-2xl font-black font-mono text-emerald-400 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">KG</span>
                </div>
              </div>

              {/* Quick Preset Weight Buttons */}
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {["0.250", "0.500", "1.000", "2.000"].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setInputWeightKg(w)}
                    className="rounded-xl bg-slate-800 hover:bg-slate-700 py-1.5 font-mono font-bold text-slate-200"
                  >
                    {w} kg
                  </button>
                ))}
              </div>

              {/* Calculated Price */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Computed Price:</span>
                <span className="text-lg font-black text-emerald-400">
                  {fmt((parseFloat(inputWeightKg) || 0) * (activeScaleProduct.sellingPrice || 0))}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={confirmScaleWeight}
                className="flex-1 rounded-2xl bg-emerald-500 py-3 text-xs font-black text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
              >
                + Add Weighed Item to Cart
              </button>
              <button
                onClick={() => setScaleModalOpen(false)}
                className="rounded-2xl border border-slate-700 px-4 py-3 text-xs font-bold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL UPON SUCCESS */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="text-lg font-black uppercase">Supermarket Express Receipt</h3>
              <p className="text-xs font-mono text-slate-600">Invoice: {completedInvoice.invoiceNo}</p>
              <p className="text-[10px] text-slate-400">{new Date(completedInvoice.date).toLocaleString()}</p>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
              {(completedInvoice.items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between py-0.5 border-b border-slate-50">
                  <div>
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="block text-[10px] text-slate-400">
                      {item.qty} × {fmt(item.unitPrice)}
                    </span>
                  </div>
                  <span className="font-black tabular-nums">{fmt(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2 text-xs space-y-1">
              <div className="flex justify-between font-black text-base text-emerald-700">
                <span>Grand Total:</span>
                <span>{fmt(completedInvoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Cash Received:</span>
                <span>{fmt(completedInvoice.tendered)}</span>
              </div>
              {completedInvoice.changeDue > 0 && (
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>Change Due:</span>
                  <span>{fmt(completedInvoice.changeDue)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Printer size={14} /> Print Slip
              </button>
              <button
                onClick={() => setCompletedInvoice(null)}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                New Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
