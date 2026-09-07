"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  LayoutGrid,
  Flame,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Printer,
  ChevronLeft,
  Users,
  Clock,
  CheckCircle2,
  DollarSign,
  Coffee,
  Wine,
  Pizza,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";

interface TableOption {
  id: string;
  tableNo: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "BILLING";
  currentBill?: number;
  guestCount?: number;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  isKitchenItem?: boolean;
}

interface RestaurantCartItem {
  id: string;
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  course: "STARTER" | "MAIN" | "BEVERAGE" | "DESSERT";
  notes?: string;
  seatNo?: number;
  kotStatus: "PENDING" | "SENT_TO_KITCHEN" | "PREPARING" | "SERVED";
}

const DEFAULT_TABLES: TableOption[] = [
  { id: "T-01", tableNo: "T-01 (Window)", capacity: 4, status: "OCCUPIED", currentBill: 1450, guestCount: 3 },
  { id: "T-02", tableNo: "T-02 (Window)", capacity: 4, status: "AVAILABLE" },
  { id: "T-03", tableNo: "T-03 (Booth)", capacity: 6, status: "OCCUPIED", currentBill: 3200, guestCount: 5 },
  { id: "T-04", tableNo: "T-04 (Booth)", capacity: 6, status: "RESERVED", guestCount: 4 },
  { id: "T-05", tableNo: "T-05 (Center)", capacity: 2, status: "AVAILABLE" },
  { id: "T-06", tableNo: "T-06 (Center)", capacity: 2, status: "AVAILABLE" },
  { id: "T-07", tableNo: "T-07 (VIP Lounge)", capacity: 8, status: "OCCUPIED", currentBill: 8900, guestCount: 7 },
  { id: "T-08", tableNo: "T-08 (Patio)", capacity: 4, status: "AVAILABLE" },
];

export default function RestaurantPOSPage() {
  const [tables, setTables] = useState<TableOption[]>(DEFAULT_TABLES);
  const [selectedTable, setSelectedTable] = useState<TableOption>(DEFAULT_TABLES[0]);
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY" | "DELIVERY">("DINE_IN");
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<RestaurantCartItem[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [waiterName, setWaiterName] = useState("Staff 1");
  const [tipAmount, setTipAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completedBill, setCompletedBill] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get("/products", { params: { limit: 150 } });
      const pData = (res.data as any)?.data ?? res.data ?? [];
      setProducts(
        Array.isArray(pData) && pData.length > 0
          ? pData.map((p: any) => ({
              id: p.id,
              name: p.name,
              category: p.category?.name || "Main Dishes",
              sellingPrice: Number(p.sellingPrice || 0),
            }))
          : [
              { id: "M1", name: "Grilled Chicken Steak", category: "Mains", sellingPrice: 650 },
              { id: "M2", name: "Spaghetti Bolognese", category: "Pastas", sellingPrice: 520 },
              { id: "M3", name: "Crispy Calamari", category: "Starters", sellingPrice: 380 },
              { id: "M4", name: "Margherita Pizza", category: "Pizza", sellingPrice: 780 },
              { id: "M5", name: "Fresh Mint Lemonade", category: "Beverages", sellingPrice: 180 },
              { id: "M6", name: "Chocolate Lava Cake", category: "Desserts", sellingPrice: 320 },
            ]
      );
    } catch (err) {
      console.error("Failed to load restaurant menu:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const addToCart = (item: MenuItem, course: "STARTER" | "MAIN" | "BEVERAGE" | "DESSERT" = "MAIN") => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === item.id && i.course === course);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].qty += 1;
        return copy;
      }
      return [
        {
          id: `${item.id}-${Date.now()}`,
          productId: item.id,
          name: item.name,
          qty: 1,
          unitPrice: item.sellingPrice,
          course,
          kotStatus: "PENDING",
        },
        ...prev,
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const sendKotToKitchen = () => {
    setCart((prev) => prev.map((item) => ({ ...item, kotStatus: "SENT_TO_KITCHEN" })));
    alert(`KOT Ticket sent to Kitchen Display System (KDS) for Table ${selectedTable.tableNo}!`);
  };

  const subTotal = cart.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
  const vatAmount = subTotal * 0.05; // 5% restaurant VAT
  const serviceCharge = subTotal * 0.05; // 5% service charge
  const grandTotal = subTotal + vatAmount + serviceCharge + tipAmount;

  const handleSettleBill = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const itemsPayload = cart.map((i) => ({
        productId: i.productId,
        qty: i.qty,
        unitPrice: i.unitPrice,
        lineTotal: i.qty * i.unitPrice,
        notes: `Course: ${i.course} · Table: ${selectedTable.tableNo}`,
      }));

      const res = await api.post("/sales", {
        paymentMethod: "CASH",
        items: itemsPayload,
        subTotal,
        grandTotal,
        notes: `Restaurant Dine-in · Table: ${selectedTable.tableNo} · Waiter: ${waiterName} · Tip: ৳${tipAmount}`,
      });

      const invData = res.data?.data || res.data || { invoiceNo: `REST-${Date.now().toString().slice(-6)}` };
      setCompletedBill({
        ...invData,
        table: selectedTable,
        waiterName,
        items: cart,
        subTotal,
        vatAmount,
        serviceCharge,
        tipAmount,
        grandTotal,
        date: new Date().toISOString(),
      });
      setCart([]);
    } catch (err) {
      setCompletedBill({
        invoiceNo: `REST-${Date.now().toString().slice(-6)}`,
        table: selectedTable,
        waiterName,
        items: cart,
        subTotal,
        vatAmount,
        serviceCharge,
        tipAmount,
        grandTotal,
        date: new Date().toISOString(),
      });
      setCart([]);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
    const q = searchFilter.toLowerCase().trim();
    return matchesCat && (!q || p.name.toLowerCase().includes(q));
  });

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-3 -m-4 sm:-m-6 p-3 sm:p-4 bg-slate-950 text-slate-100 select-none overflow-hidden">
      
      {/* Top Restaurant Header */}
      <div className="flex-none flex flex-wrap items-center justify-between gap-3 bg-slate-900 rounded-2xl p-3 sm:px-4 border border-indigo-900/60 shadow-lg">
        <div className="flex items-center gap-3">
          <Link
            href="/restaurant"
            className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <h1 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <UtensilsCrossed size={16} className="text-indigo-400" /> Restaurant Floor & Table POS
              </h1>
              <span className="rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.2 text-[10px] font-bold uppercase">
                Floor Service
              </span>
            </div>
          </div>
        </div>

        {/* Order Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {(["DINE_IN", "TAKEAWAY", "DELIVERY"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setOrderType(m)}
              className={`rounded-lg px-3 py-1 font-bold transition ${
                orderType === m ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {m.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace: Left Floor Map + Middle Menu Grid + Right Table Bill & KOT */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        
        {/* Left 3 Columns: Interactive Floor Table Map */}
        <div className="lg:col-span-3 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex-none p-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-black text-white flex items-center gap-1">
              <LayoutGrid size={14} className="text-indigo-400" /> Floor Tables
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {tables.filter((t) => t.status === "OCCUPIED").length} Active
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 grid grid-cols-2 gap-2">
            {tables.map((t) => {
              const isSelected = selectedTable.id === t.id;
              let statusBg = "bg-slate-900 border-slate-700/80 text-slate-300";
              if (t.status === "OCCUPIED") statusBg = "bg-indigo-950/60 border-indigo-500/60 text-indigo-200";
              if (t.status === "RESERVED") statusBg = "bg-amber-950/40 border-amber-500/50 text-amber-200";

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTable(t)}
                  className={`p-3 rounded-2xl border flex flex-col justify-between text-left transition shadow-xs ${statusBg} ${
                    isSelected ? "ring-2 ring-indigo-400 border-indigo-400 scale-[1.02]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{t.tableNo.split(" ")[0]}</span>
                    <span className="text-[9px] font-mono text-slate-400">{t.capacity}p</span>
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="uppercase font-bold text-[9px] text-slate-400">{t.status}</span>
                    {t.currentBill && <span className="font-bold text-indigo-400">{fmt(t.currentBill)}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle 5 Columns: Food Menu Grid */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex-none p-3 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search food & beverages..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === c
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="flex flex-col justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/80 hover:bg-slate-900/90 transition text-left group shadow-xs"
                >
                  <p className="font-bold text-slate-100 text-xs line-clamp-2 group-hover:text-indigo-300">
                    {p.name}
                  </p>
                  <div className="mt-2 pt-1 border-t border-slate-800 flex items-center justify-between w-full">
                    <span className="text-xs font-black text-indigo-400 tabular-nums">
                      {fmt(p.sellingPrice)}
                    </span>
                    <span className="text-[10px] text-slate-500">+Add</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Table Order Ticket, KOT Dispatch & Split Bill */}
        <div className="lg:col-span-4 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
          <div className="flex-none p-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white">{selectedTable.tableNo}</span>
                <span className="rounded bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 text-[10px] font-bold">
                  {orderType}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Order Lines: {cart.length}</span>
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
                <UtensilsCrossed size={36} className="mx-auto text-slate-600" />
                <p className="text-xs font-bold text-slate-400">No Orders for Table</p>
                <p className="text-[11px]">Select items to dispatch KOT or print customer bill.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="pt-1.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="font-bold text-white truncate">{item.name}</p>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                          item.kotStatus === "SENT_TO_KITCHEN"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {item.kotStatus === "SENT_TO_KITCHEN" ? "KOT Sent" : "Pending"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {fmt(item.unitPrice)} × {item.qty}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                    <button onClick={() => updateQty(item.id, -1)} className="px-1 text-slate-400 font-bold">
                      −
                    </button>
                    <span className="w-5 text-center font-mono font-bold text-indigo-400 text-xs">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="px-1 text-slate-400 font-bold">
                      +
                    </button>
                  </div>

                  <span className="w-14 text-right font-black text-indigo-300 text-xs">
                    {fmt(item.qty * item.unitPrice)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Bottom Actions: KOT Dispatch + Bill Settlement */}
          <div className="flex-none p-3.5 bg-slate-950 border-t border-slate-800 space-y-2.5 text-xs">
            <div className="space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-slate-200 font-bold">{fmt(subTotal)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>VAT (5%) + Service (5%):</span>
                <span>{fmt(vatAmount + serviceCharge)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-slate-800">
                <span className="text-xs uppercase font-bold text-indigo-400">Total Bill</span>
                <span className="text-2xl font-black text-indigo-400 tabular-nums">{fmt(grandTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={sendKotToKitchen}
                disabled={cart.length === 0}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-amber-400 border border-amber-500/30 flex items-center justify-center gap-1 disabled:opacity-40"
              >
                <Flame size={14} /> Send KOT
              </button>
              <button
                onClick={handleSettleBill}
                disabled={cart.length === 0 || submitting}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1 disabled:opacity-40"
              >
                <Receipt size={14} /> Settle Bill
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RESTAURANT GUEST SLIP MODAL */}
      {completedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                Restaurant Guest Bill
              </span>
              <h3 className="text-lg font-black uppercase mt-1">Dine-In Guest Check</h3>
              <p className="text-xs font-mono text-slate-600">Table: {completedBill.table?.tableNo} · Invoice: {completedBill.invoiceNo}</p>
              <p className="text-[10px] text-slate-400">{new Date(completedBill.date).toLocaleString()}</p>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
              {(completedBill.items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between py-0.5 border-b border-slate-50">
                  <div>
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="block text-[10px] text-slate-400">
                      {item.qty} × {fmt(item.unitPrice)}
                    </span>
                  </div>
                  <span className="font-black tabular-nums">{fmt(item.qty * item.unitPrice)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2 text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>{fmt(completedBill.subTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>VAT + Service:</span>
                <span>{fmt(completedBill.vatAmount + completedBill.serviceCharge)}</span>
              </div>
              <div className="flex justify-between font-black text-base text-indigo-800 pt-1">
                <span>Total Settled:</span>
                <span>{fmt(completedBill.grandTotal)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Printer size={14} /> Print Guest Check
              </button>
              <button
                onClick={() => setCompletedBill(null)}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Next Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
