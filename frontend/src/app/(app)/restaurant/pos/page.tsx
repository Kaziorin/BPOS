"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Utensils,
  ChefHat,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  ChevronLeft,
  Users,
  LayoutGrid,
  List,
  Flame,
  QrCode,
  Bell,
  PauseCircle,
  RotateCcw,
  Split,
  ArrowRightLeft,
  Star,
  Leaf,
  Tag,
  Percent,
  Gift,
  FileText,
  ShoppingBag,
  X,
  Coffee,
  RefreshCw,
} from "lucide-react";
import { api, TENANT_STORAGE_KEY } from "@/lib/api";
import { toast } from "react-toastify";
import { ConfirmModal, CustomModal, CustomPromptModal, CustomInput, CustomButton } from "@/components/custom";
import { getCategoryIcon } from "@/lib/categoryIcons";

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
  image: string;
  isPopular?: boolean;
  isVeg?: boolean;
  description?: string;
}

interface CartModifier {
  label: string;
  value: string;
}

interface RestaurantCartItem {
  id: string;
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  modifiers?: CartModifier[];
  notes?: string;
  kotStatus: "PENDING" | "SENT_TO_KITCHEN" | "PREPARING" | "SERVED";
}

export default function RestaurantPOSPage() {
  const [storeName, setStoreName] = useState<string>("BlueOceans POS SYSTEM");
  const [tables, setTables] = useState<TableOption[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableOption | null>(null);
  const [guestCount, setGuestCount] = useState(2);
  const [waiterName, setWaiterName] = useState("Staff 1");
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY" | "DELIVERY">("DINE_IN");

  const [products, setProducts] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<RestaurantCartItem[]>([]);

  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [searchFilter, setSearchFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [orderNote, setOrderNote] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState(250);

  const [showHoldModal, setShowHoldModal] = useState(false);
  const [heldOrders, setHeldOrders] = useState<any[]>([]);

  const [completedBill, setCompletedBill] = useState<any | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSelectTableModal, setShowSelectTableModal] = useState(false);

  // Prompt Modal State
  const [promptModalState, setPromptModalState] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    placeholder?: string;
    defaultValue?: string;
    inputType?: "text" | "number" | "textarea";
    onSubmit?: (val: string) => void;
  }>({
    isOpen: false,
    title: "",
  });

  const [dbCategories, setDbCategories] = useState<any[]>([]);

  // Load tenant/store info & real DB data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        const tenantStr = localStorage.getItem(TENANT_STORAGE_KEY);
        if (tenantStr) {
          try {
            const parsed = JSON.parse(tenantStr);
            if (parsed?.name) {
              setStoreName(parsed.name);
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      try {
        const resCatList = await api.get("/v1/products/categories");
        const cData = (resCatList as any)?.data ?? resCatList ?? [];
        if (Array.isArray(cData)) {
          setDbCategories(cData);
        }
      } catch (e) {
        console.error("Failed to load category metadata:", e);
      }

      const resProd = await api.get("/products", { params: { limit: 150 } });
      const pData = (resProd as any)?.data ?? resProd ?? [];
      if (Array.isArray(pData)) {
        const mappedProducts: MenuItem[] = pData.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category?.name || p.categoryName || "General",
          sellingPrice: Number(p.sellingPrice || p.price || 0),
          image: p.imageUrl || p.image || "",
          isPopular: Boolean(p.isPopular),
          isVeg: Boolean(p.isVeg),
          description: p.description || "",
        }));
        setProducts(mappedProducts);
      }

      const resTables = await api.get("/v1/restaurant/tables");
      const tData = (resTables as any)?.data ?? resTables ?? [];
      if (Array.isArray(tData)) {
        const mappedTables: TableOption[] = tData.map((t: any) => ({
          id: t.id,
          tableNo: t.tableNo || t.name || `Table ${t.id.slice(0, 4)}`,
          capacity: Number(t.capacity || 4),
          status: t.status || "AVAILABLE",
          currentBill: t.currentBill ? Number(t.currentBill) : undefined,
          guestCount: t.guestCount ? Number(t.guestCount) : undefined,
        }));
        setTables(mappedTables);
        if (mappedTables.length > 0) {
          setSelectedTable(mappedTables[0]);
        }
      }
    } catch (err: any) {
      console.error("Failed to load POS real data:", err);
      toast.error(err?.message || "Error loading menu & table data from server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dynamicCategories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  );

  const categories = [
    { id: "All Items", label: "All Items", icon: LayoutGrid },
    { id: "Popular", label: "Popular", icon: Star },
    ...dynamicCategories.map((cat) => {
      const dbCat = dbCategories.find(
        (c: any) => c.name?.toLowerCase() === cat.toLowerCase()
      );
      return {
        id: cat,
        label: cat,
        icon: getCategoryIcon(dbCat?.icon, cat),
      };
    }),
  ];

  const fmt = (n: number) =>
    `৳${Number(n || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === item.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].qty += 1;
        return copy;
      }
      return [
        ...prev,
        {
          id: `${item.id}-${Date.now()}`,
          productId: item.id,
          name: item.name,
          qty: 1,
          unitPrice: item.sellingPrice,
          kotStatus: "PENDING",
        },
      ];
    });
    toast.success(`Added ${item.name} to order`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeCartItem = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || customPrice <= 0) return;
    const newItem: MenuItem = {
      id: `custom-${Date.now()}`,
      name: customName,
      category: "Add-ons",
      sellingPrice: customPrice,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    };
    setProducts((prev) => [newItem, ...prev]);
    addToCart(newItem);
    setShowCustomItemModal(false);
    setCustomName("");
    setCustomPrice(250);
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    setHeldOrders((prev) => [
      ...prev,
      {
        id: `HOLD-${Date.now().toString().slice(-4)}`,
        table: selectedTable,
        guestCount,
        waiterName,
        cart,
        time: new Date().toLocaleTimeString(),
      },
    ]);
    setCart([]);
    toast.info(`Order for Table ${selectedTable?.tableNo || "N/A"} put on Hold!`);
  };

  const handleRecallOrder = (heldOrder: any) => {
    if (heldOrder.table) setSelectedTable(heldOrder.table);
    setGuestCount(heldOrder.guestCount);
    setWaiterName(heldOrder.waiterName);
    setCart(heldOrder.cart);
    setHeldOrders((prev) => prev.filter((o) => o.id !== heldOrder.id));
    setShowHoldModal(false);
    toast.success(`Recalled order ${heldOrder.id}!`);
  };

  const sendKotToKitchen = () => {
    if (cart.length === 0) return;
    setCart((prev) => prev.map((item) => ({ ...item, kotStatus: "SENT_TO_KITCHEN" })));
    toast.success(
      `KOT Ticket sent to Kitchen Display System for Table ${selectedTable?.tableNo || "N/A"}!`
    );
  };

  const rawSubtotal = cart.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
  const discountAmount = (rawSubtotal * discountPercent) / 100;
  const subTotal = Math.max(0, rawSubtotal - discountAmount);
  const taxAmount = subTotal * 0.08;
  const serviceCharge = subTotal * 0.04;
  const grandTotal = subTotal + taxAmount + serviceCharge;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      // Build payload for the backend POS confirm endpoint
      const payload = {
        items: cart.map((i) => ({
          productId: i.productId,
          variantId: null,
          name: i.name,
          qty: i.qty,
          unitPrice: i.unitPrice,
          discountAmount: 0,
          lineTotal: i.qty * i.unitPrice,
        })),
        payments: [{ method: "CASH", amount: grandTotal }],
        subTotal: subTotal,
        grandTotal: grandTotal,
        discountTotal: discountAmount,
        taxTotal: taxAmount,
        serviceCharge: serviceCharge,
        note: `Restaurant | Table: ${selectedTable?.tableNo || "N/A"} | ${orderType} | Waiter: ${waiterName}`,
      };

      // Call backend to save the sale and deduct inventory
      const res: any = await api.post("/api/v1/pos/confirm", payload);
      const saleResult = res?.data ?? res ?? {};
      const invNo = saleResult.invoiceNo || `REST-${Math.floor(100000 + Math.random() * 900000)}`;

      const billData = {
        invoiceNo: invNo,
        table: selectedTable,
        guestCount,
        waiterName,
        orderType,
        items: cart,
        rawSubtotal,
        discountAmount,
        subTotal,
        taxAmount,
        serviceCharge,
        grandTotal,
        date: new Date().toISOString(),
      };

      setCompletedBill(billData);
      setCart([]);
      setDiscountPercent(0);
      toast.success(`Order #${invNo} placed & synced to system!`);

      // Reload product list to reflect updated stock
      loadData();
    } catch (err: any) {
      console.error("Restaurant POS order error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to place order. Please try again.");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "All Items"
        ? true
        : selectedCategory === "Popular"
        ? p.isPopular
        : p.category.toLowerCase() === selectedCategory.toLowerCase();
    const q = searchFilter.toLowerCase().trim();
    const matchesSearch =
      !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 text-gray-600 font-sans select-none overflow-hidden">
      {/* ══════════════ 1. TOP ORANGE HEADER BAR ══════════════ */}
      <header className="flex-none flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-sm z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/restaurant"
            className="flex items-center justify-center p-2 rounded-md bg-white/10 hover:bg-white/20 text-white transition"
            title="Back to Restaurant Dashboard"
          >
            <ChevronLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-orange-600 shadow-xs">
              <ChefHat size={20} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-none text-white flex items-center gap-1.5">
                {storeName}{" "}
                <span className="text-orange-200 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  POS SYSTEM
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white/20 p-1 rounded-md shadow-inner">
          <button
            onClick={() => setOrderType("DINE_IN")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              orderType === "DINE_IN"
                ? "bg-white text-orange-600 shadow-xs"
                : "text-white hover:bg-white/10"
            }`}
          >
            <Utensils size={13} /> Dine In
          </button>
          <button
            onClick={() => setOrderType("TAKEAWAY")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              orderType === "TAKEAWAY"
                ? "bg-white text-orange-600 shadow-xs"
                : "text-white hover:bg-white/10"
            }`}
          >
            <ShoppingBag size={13} /> Take Away
          </button>
          <button
            onClick={() => setOrderType("DELIVERY")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              orderType === "DELIVERY"
                ? "bg-white text-orange-600 shadow-xs"
                : "text-white hover:bg-white/10"
            }`}
          >
            <Flame size={13} /> Delivery
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-44 sm:w-60">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-200"
            />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search items..."
              className="w-full rounded-md bg-white/15 border border-white/20 py-1.5 pl-8 pr-3 text-xs font-medium text-white placeholder-orange-100/70 focus:bg-white focus:text-gray-800 focus:placeholder-gray-400 focus:outline-none transition"
            />
          </div>
          <button
            onClick={loadData}
            title="Refresh Data"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15 hover:bg-white/20 text-white transition"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15 hover:bg-white/20 text-white transition">
            <QrCode size={16} />
          </button>
          <button className="relative flex h-8 w-8 items-center justify-center rounded-md bg-white/15 hover:bg-white/20 text-white transition">
            <Bell size={16} />
            <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
              3
            </span>
          </button>
        </div>
      </header>

      {/* ══════════════ 2. SUB-HEADER CONTROLS BAR ══════════════ */}
      <div className="flex-none flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-white border-b border-slate-200 shadow-2xs z-10">
        <div className="flex flex-wrap items-center gap-3 text-gray-600">
          <button
            onClick={() => setShowSelectTableModal(true)}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-100 transition cursor-pointer"
          >
            <LayoutGrid size={15} className="text-orange-600" />
            <span className="text-xs font-medium text-gray-500">Table:</span>
            <span className="text-xs font-bold text-gray-800">
              {selectedTable ? `${selectedTable.tableNo} (${selectedTable.capacity} Seats)` : "Select Table"}
            </span>
          </button>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
            <Users size={15} className="text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Guests:</span>
            <span className="text-xs font-bold text-gray-800 min-w-4 text-center">
              {guestCount}
            </span>
            <button
              onClick={() => setGuestCount((g) => g + 1)}
              className="flex h-5 w-5 items-center justify-center rounded-md bg-white border border-slate-200 text-gray-700 font-bold hover:bg-slate-100 cursor-pointer"
            >
              <Plus size={11} />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
            <ChefHat size={15} className="text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Waiter:</span>
            <select
              value={waiterName}
              onChange={(e) => setWaiterName(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="Staff 1">Staff 1</option>
              <option value="Staff 2">Staff 2</option>
              <option value="Manager">Manager</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleHoldOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-orange-200 bg-orange-50 text-orange-600 text-xs font-bold hover:bg-orange-100 transition cursor-pointer"
          >
            <PauseCircle size={14} /> Hold
          </button>
          <button
            onClick={() => setShowHoldModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
          >
            <RotateCcw size={14} /> Recall ({heldOrders.length})
          </button>
          <button
            onClick={() => toast.info("Split Bill feature active")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
          >
            <Split size={14} /> Split
          </button>
          <button
            onClick={() => toast.info("Transfer Table feature active")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
          >
            <ArrowRightLeft size={14} /> Transfer
          </button>
          <button
            onClick={() => {
              if (cart.length > 0) setShowClearConfirm(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
          >
            <Trash2 size={14} /> Clear Order
          </button>
        </div>
      </div>

      {/* ══════════════ 3. MAIN POS WORKSPACE ══════════════ */}
      <div className="flex-1 min-h-0 flex gap-3 p-3 overflow-hidden">
        {/* ── LEFT CATEGORY SIDEBAR ── */}
        <aside className="w-56 sm:w-64 flex-none flex flex-col justify-between rounded-xl bg-white border border-slate-200 p-2.5 shadow-2xs overflow-hidden">
          <div className="space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              const count = products.filter((p) => {
                if (cat.id === "All Items") return true;
                if (cat.id === "Popular") return p.isPopular;
                return p.category.toLowerCase() === cat.id.toLowerCase();
              }).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/20 border border-orange-600"
                      : "bg-white text-gray-700 border border-slate-100 hover:bg-orange-50/80 hover:text-orange-600 hover:border-orange-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-md shrink-0 transition ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-orange-50 text-orange-600 border border-orange-100"
                      }`}
                    >
                      <Icon size={15} />
                    </div>
                    <span className="truncate">{cat.label}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      isSelected
                        ? "bg-white/25 text-white"
                        : "bg-slate-100 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowCustomItemModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-dashed border-orange-400 bg-orange-50/70 text-orange-700 text-xs font-bold hover:bg-orange-100 transition cursor-pointer"
            >
              <ChefHat size={16} className="text-orange-600" /> Custom Item
            </button>
          </div>
        </aside>

        {/* ── CENTER MENU ITEMS GRID ── */}
        <main className="flex-1 flex flex-col rounded-xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
          <div className="flex-none p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-xs font-bold text-gray-800 tracking-tight flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-xs shadow-orange-500/50" />
              {selectedCategory} ({filteredProducts.length})
            </h2>
            <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-md">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded-md text-xs font-bold transition ${
                  viewMode === "grid"
                    ? "bg-white text-orange-600 shadow-2xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1 rounded-md text-xs font-bold transition ${
                  viewMode === "list"
                    ? "bg-white text-orange-600 shadow-2xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <List size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            {loading ? (
              <div className="py-20 text-center text-gray-400 space-y-2">
                <RefreshCw size={24} className="mx-auto animate-spin text-orange-500" />
                <p className="text-xs font-medium">Loading food products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center text-gray-400 space-y-2">
                <ShoppingBag size={32} className="mx-auto text-gray-300" />
                <p className="text-xs font-bold text-gray-600">No products found</p>
                <p className="text-[11px] text-gray-400">
                  Try selecting another category or add items from Products module.
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5"
                    : "space-y-2.5"
                }
              >
                {filteredProducts.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className={`group relative flex rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-orange-500 hover:shadow-md hover:shadow-orange-500/10 transition-all duration-200 cursor-pointer overflow-hidden ${
                      viewMode === "list"
                        ? "flex-row items-center p-2.5 gap-3"
                        : "flex-col justify-between"
                    }`}
                  >
                    {/* Dish Image / Placeholder Container (Flush on top, left, right in Grid View) */}
                    <div
                      className={`relative overflow-hidden bg-gradient-to-br from-amber-50/50 to-orange-50/30 flex items-center justify-center shrink-0 ${
                        viewMode === "list"
                          ? "h-16 w-16 rounded-lg"
                          : "h-28 sm:h-30 w-full border-b border-slate-100"
                      }`}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-orange-300/70 gap-1 p-2">
                          <Utensils size={viewMode === "list" ? 22 : 28} className="text-orange-400" />
                          {viewMode !== "list" && (
                            <span className="text-[10px] text-orange-400/80 font-semibold tracking-wide">
                              Fresh Dish
                            </span>
                          )}
                        </div>
                      )}

                      {/* Real Badges from DB */}
                      {(item.isPopular || item.isVeg) && (
                        <div className="absolute left-2 top-2 flex items-center gap-1 z-10">
                          {item.isPopular && (
                            <span
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black shadow-xs"
                              title="Popular Item"
                            >
                              <Star size={10} fill="white" /> Popular
                            </span>
                          )}
                          {item.isVeg && (
                            <span
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black shadow-xs"
                              title="Vegetarian"
                            >
                              <Leaf size={10} fill="white" /> Veg
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Title & Price & Right Add Button Row */}
                    <div
                      className={`flex items-end justify-between gap-2 ${
                        viewMode === "list" ? "flex-1 min-w-0" : "p-3 w-full flex-1"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xs sm:text-sm text-gray-800 line-clamp-1 group-hover:text-orange-600 transition">
                          {item.name}
                        </h3>
                        <span className="font-black text-sm sm:text-base text-orange-600 mt-1 block tabular-nums">
                          {fmt(item.sellingPrice)}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-xs hover:from-orange-700 hover:to-amber-600 transition cursor-pointer shrink-0"
                        title="Add to Order"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Toolbar Row under Menu */}
          <div className="flex-none p-2.5 border-t border-slate-200 bg-slate-50/70 grid grid-cols-6 gap-2">
            <button
              onClick={() => {
                setPromptModalState({
                  isOpen: true,
                  title: "Apply Coupon Code",
                  placeholder: "e.g. SAVE10",
                  inputType: "text",
                  onSubmit: (code) => {
                    if (code) toast.success(`Coupon "${code}" applied!`);
                  },
                });
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-bold text-gray-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <Tag size={13} className="text-orange-600" /> Coupon
            </button>

            <button
              onClick={() => {
                setPromptModalState({
                  isOpen: true,
                  title: "Enter Discount Percentage (%)",
                  placeholder: "10",
                  defaultValue: String(discountPercent || 10),
                  inputType: "number",
                  onSubmit: (pct) => {
                    if (pct) setDiscountPercent(Number(pct));
                  },
                });
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-bold text-gray-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <Percent size={13} className="text-orange-600" /> Discount
            </button>

            <button
              onClick={() => toast.info("Promo Campaign applied")}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-bold text-gray-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <Gift size={13} className="text-orange-600" /> Promo
            </button>

            <button
              onClick={() => {
                setPromptModalState({
                  isOpen: true,
                  title: "Add Order Note",
                  placeholder: "Enter special order notes...",
                  defaultValue: orderNote,
                  inputType: "textarea",
                  onSubmit: (n) => {
                    setOrderNote(n);
                  },
                });
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-bold text-gray-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <FileText size={13} className="text-orange-600" /> Note
            </button>

            <button
              onClick={() => {
                setPromptModalState({
                  isOpen: true,
                  title: "Kitchen Note for Chef",
                  placeholder: "Add instructions for kitchen...",
                  inputType: "textarea",
                  onSubmit: (kn) => {
                    if (kn) toast.success("Kitchen note attached!");
                  },
                });
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-bold text-gray-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <ChefHat size={13} className="text-orange-600" /> Kitchen Note
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-bold text-gray-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <Printer size={13} className="text-orange-600" /> Print
            </button>
          </div>
        </main>

        {/* ── RIGHT ORDER SUMMARY PANEL ── */}
        <aside className="w-80 sm:w-96 flex-none flex flex-col rounded-md bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex-none p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-gray-800">Order Summary</h2>
              <span className="rounded-md bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 text-[10px] font-bold">
                {cart.length} Items
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={12} /> Clear All
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-20 text-center text-gray-400 space-y-2">
                <ShoppingBag size={40} className="mx-auto text-gray-300" />
                <p className="text-xs font-bold text-gray-600">Cart is empty</p>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  Click on food items to add them to this table order.
                </p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={item.id} className="pt-2.5 first:pt-0">
                  <div className="flex items-start gap-2">
                    <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md bg-orange-100 text-[10px] font-bold text-orange-700">
                      {idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-xs text-gray-800 truncate">{item.name}</h4>
                        <span className="font-bold text-xs text-gray-900 tabular-nums">
                          {fmt(item.qty * item.unitPrice)}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="mt-0.5 text-[10px] text-orange-600 italic">
                          &quot;{item.notes}&quot;
                        </p>
                      )}

                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="flex h-4.5 w-4.5 items-center justify-center rounded bg-white text-gray-700 font-bold hover:bg-slate-200 cursor-pointer"
                          >
                            <Minus size={9} />
                          </button>
                          <span className="w-4 text-center font-bold text-xs text-gray-800">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="flex h-4.5 w-4.5 items-center justify-center rounded bg-white text-gray-700 font-bold hover:bg-slate-200 cursor-pointer"
                          >
                            <Plus size={9} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeCartItem(item.id)}
                          className="p-1 text-gray-400 hover:text-rose-500 transition cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/50">
            <div className="relative">
              <input
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Add Order Note..."
                className="w-full rounded-md border border-slate-200 bg-white py-1 pl-2.5 pr-7 text-xs font-medium text-gray-700 focus:border-orange-500 focus:outline-none"
              />
              <FileText size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="flex-none p-3.5 bg-slate-50 border-t border-slate-200 space-y-2.5">
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-gray-800">{fmt(subTotal)}</span>
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({discountPercent}%)</span>
                  <span>−{fmt(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-500">
                <span>Tax (8%)</span>
                <span>{fmt(taxAmount)}</span>
              </div>

              <div className="flex justify-between text-gray-500">
                <span>Service Charge (4%)</span>
                <span>{fmt(serviceCharge)}</span>
              </div>

              <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200">
                <span className="text-xs uppercase font-bold text-orange-600 tracking-wider">
                  Total Payable
                </span>
                <span className="text-xl font-black text-orange-600 tabular-nums">
                  {fmt(grandTotal)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <button
                onClick={sendKotToKitchen}
                disabled={cart.length === 0}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-amber-300 bg-amber-50 text-amber-800 font-bold text-xs hover:bg-amber-100 transition cursor-pointer disabled:opacity-40"
              >
                <Flame size={14} className="text-amber-600" /> KOT to Kitchen
              </button>

              <button
                onClick={handlePlaceOrder}
                disabled={cart.length === 0}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-md bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition cursor-pointer shadow-xs disabled:opacity-40"
              >
                <span>Place Order</span>
                <div className="flex items-center gap-1.5">
                  <span className="tabular-nums">{fmt(grandTotal)}</span>
                  <ChevronLeft size={16} className="rotate-180" />
                </div>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Custom Item Modal */}
      <CustomModal
        open={showCustomItemModal}
        onClose={() => setShowCustomItemModal(false)}
        title="Add Custom Item"
        size="sm"
      >
        <form onSubmit={handleAddCustomItem} className="space-y-4">
          <div className="flex items-center gap-3 bg-orange-50 p-4 rounded-xl border border-orange-100 mb-2">
            <ChefHat className="text-orange-600" size={20} />
            <p className="text-xs font-bold text-orange-800 uppercase tracking-wider">Quick Menu Entry</p>
          </div>

          <CustomInput
            label="Item Name"
            required
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Special Chef Salad"
          />

          <CustomInput
            label="Price (৳)"
            type="number"
            required
            min="1"
            value={customPrice}
            onChange={(e) => setCustomPrice(Number(e.target.value))}
          />

          <div className="flex justify-end gap-2 pt-2">
            <CustomButton
              type="button"
              variant="outline"
              onClick={() => setShowCustomItemModal(false)}
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="submit"
              themeColor="orange"
            >
              Add Item
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      <CustomModal
        open={showHoldModal}
        onClose={() => setShowHoldModal(false)}
        title="Recall Held Orders"
        size="md"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
          {heldOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <RotateCcw size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">No held orders found</p>
            </div>
          ) : (
            heldOrders.map((h) => (
              <div
                key={h.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between group hover:bg-white hover:border-orange-200 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-slate-900 uppercase font-mono tracking-tighter">#{h.id}</span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-widest">Table {h.table?.tableNo || "N/A"}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                    {h.cart.length} items • Waiter: {h.waiterName} • {h.time}
                  </p>
                </div>
                <CustomButton
                  size="sm"
                  themeColor="orange"
                  onClick={() => handleRecallOrder(h)}
                >
                  Recall
                </CustomButton>
              </div>
            ))
          )}
        </div>
      </CustomModal>

      <CustomModal
        open={!!completedBill}
        onClose={() => setCompletedBill(null)}
        title="Dine-In Guest Receipt"
        size="sm"
      >
        <div className="space-y-5">
          <div className="text-center border-b border-dashed border-slate-300 pb-4 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
              {storeName}
            </span>
            <p className="text-xs font-mono text-slate-500 mt-2 uppercase tracking-tighter font-bold">
              Table: {completedBill?.table?.tableNo || "N/A"} • INV: {completedBill?.invoiceNo}
            </p>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
              {completedBill && new Date(completedBill.date).toLocaleString()}
            </p>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar text-xs">
            {(completedBill?.items || []).map((item: any, idx: number) => (
              <div key={idx} className="border-b border-slate-50 pb-1.5 last:border-0">
                <div className="flex justify-between font-bold text-slate-800">
                  <span className="uppercase tracking-tight">
                    {idx + 1}. {item.name}
                  </span>
                  <span className="font-black">৳{fmt(item.qty * item.unitPrice).replace('৳','')}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight pl-4 mt-0.5">
                  {item.qty} × {fmt(item.unitPrice)}
                  {item.notes && (
                    <span className="block italic text-orange-600 font-medium mt-0.5">&quot;{item.notes}&quot;</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-300 pt-3 text-xs space-y-1.5 bg-slate-50/50 p-4 rounded-2xl">
            <div className="flex justify-between text-slate-500 font-bold uppercase tracking-tighter">
              <span>Subtotal:</span>
              <span>{fmt(completedBill?.subTotal || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-500 font-bold uppercase tracking-tighter">
              <span>Tax (8%):</span>
              <span>{fmt(completedBill?.taxAmount || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-500 font-bold uppercase tracking-tighter">
              <span>Service Charge (4%):</span>
              <span>{fmt(completedBill?.serviceCharge || 0)}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-orange-600 pt-2 border-t border-orange-100">
              <span className="uppercase tracking-tight">Total Payable:</span>
              <span>{fmt(completedBill?.grandTotal || 0)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <CustomButton
              fullWidth
              variant="outline"
              onClick={() => window.print()}
              leftIcon={<Printer size={16} />}
            >
              Print
            </CustomButton>
            <CustomButton
              fullWidth
              themeColor="orange"
              onClick={() => setCompletedBill(null)}
            >
              Next Table
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Confirm Clear Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          setCart([]);
          setShowClearConfirm(false);
          toast.info("Cart cleared successfully");
        }}
        type="DANGER"
        title="Clear Current Order?"
        message="Are you sure you want to remove all items from this table's order?"
        confirmText="Clear Order"
        cancelText="Cancel"
      />

      {/* ══════════════ SELECT TABLE MODAL ══════════════ */}
      <CustomModal
        open={showSelectTableModal}
        onClose={() => setShowSelectTableModal(false)}
        title="Select Dining Table"
        size="lg"
      >
        <div className="space-y-5">
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 py-3 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
              <span>Selected</span>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            {tables.length === 0 ? (
              <div className="py-20 text-center text-slate-300 space-y-3">
                <LayoutGrid size={48} className="mx-auto opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">No tables found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {tables.map((t) => {
                  const isSelected = selectedTable?.id === t.id;
                  const isOccupied = t.status === "OCCUPIED" || t.status === "BILLING";

                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTable(t);
                        setShowSelectTableModal(false);
                        toast.info(`Selected Table ${t.tableNo}`);
                      }}
                      className={`flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer select-none group ${
                        isSelected
                          ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/30"
                          : isOccupied
                          ? "bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400"
                          : "bg-emerald-50 text-emerald-950 border-emerald-100 hover:border-emerald-300"
                      }`}
                    >
                      <span className={`text-lg font-black tracking-tighter ${isSelected ? "text-white" : "text-slate-800"}`}>
                        {t.tableNo}
                      </span>
                      <div className={`flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        isSelected ? "bg-white/20 text-white" : "bg-white/60 text-slate-400"
                      }`}>
                        <Users size={10} strokeWidth={3} /> {t.capacity}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <CustomButton
              variant="outline"
              onClick={() => setShowSelectTableModal(false)}
            >
              Cancel
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Reusable Custom Prompt Modal */}
      <CustomPromptModal
        isOpen={promptModalState.isOpen}
        onClose={() => setPromptModalState((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={(val) => {
          if (promptModalState.onSubmit) promptModalState.onSubmit(val);
        }}
        title={promptModalState.title}
        description={promptModalState.description}
        placeholder={promptModalState.placeholder}
        defaultValue={promptModalState.defaultValue}
        inputType={promptModalState.inputType}
      />
    </div>
  );
}
