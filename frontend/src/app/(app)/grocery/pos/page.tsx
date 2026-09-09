"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingCart, Scale, Search, Plus, Trash2,
  PauseCircle, Play, CheckCircle2, Printer, ChevronLeft,
  CreditCard, ArrowRight, ShoppingBag, Clock, Users, History,
  Settings, Tag, RotateCcw, ScanLine, Gift, Package, Star,
  Apple, Coffee, Home, Wallet, FileText, X,
  Layers, Grid, AlignLeft, Camera,
  Utensils, Snowflake, Fish, Sparkles, Heart, ShieldCheck, ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";

interface CartItem {
  id: string; productId: string; name: string; sku: string;
  barcode?: string; unitPrice: number; qty: number;
  isWeighed?: boolean; weightKg?: number; lineTotal: number;
  discountPct?: number; uom?: string;
}
interface Product {
  id: string; name: string; sku: string; barcode?: string;
  sellingPrice: number; uom: string;
  category?: { name: string }; stock?: number;
}

const EMOJI_MAP: [string, string][] = [
  ["banana", "🍌"], ["apple", "🍎"], ["potato", "🥔"], ["onion", "🧅"],
  ["tomato", "🍅"], ["cucumber", "🥒"], ["carrot", "🥕"], ["rice", "🌾"],
  ["oil", "🫙"], ["milk", "🥛"], ["egg", "🥚"], ["sugar", "🍬"],
  ["atta", "🌾"], ["flour", "🌾"], ["lays", "🍟"], ["chips", "🍟"],
  ["cola", "🥤"], ["coca", "🥤"], ["pepsi", "🥤"], ["nescafe", "☕"],
  ["coffee", "☕"], ["tea", "🍵"], ["soap", "🧼"], ["detergent", "🧴"],
  ["tissue", "🧻"], ["water", "💧"], ["bread", "🍞"], ["butter", "🧈"],
  ["cheese", "🧀"], ["yogurt", "🫙"], ["fish", "🐟"], ["meat", "🥩"],
  ["chicken", "🍗"], ["mango", "🥭"], ["orange", "🍊"], ["lemon", "🍋"],
  ["salt", "🧂"], ["pepper", "🌶"], ["biscuit", "🍪"], ["chocolate", "🍫"],
  ["croissant", "🥐"], ["cake", "🍰"], ["pizza", "🍕"], ["ice cream", "🍨"],
  ["nuggets", "🍗"], ["salmon", "🐟"], ["steak", "🥩"], ["wash", "🧴"],
  ["shampoo", "🧴"], ["baby", "🍼"], ["cat", "🐱"], ["dog", "🐶"],
];
function getEmoji(name: string) {
  const n = name.toLowerCase();
  for (const [k, e] of EMOJI_MAP) if (n.includes(k)) return e;
  return "🛒";
}
function getEmojiColor(_emoji: string) {
  return "#ffffff";
}

const DEMO_PRODUCTS: Product[] = [
  { id: "d1", name: "Banana", sku: "BAN-1KG", sellingPrice: 60, uom: "kg", category: { name: "Fruits & Veg" } },
  { id: "d2", name: "Red Apple", sku: "APL-1KG", sellingPrice: 180, uom: "kg", category: { name: "Fruits & Veg" } },
  { id: "d3", name: "Potato", sku: "POT-1KG", sellingPrice: 30, uom: "kg", category: { name: "Fruits & Veg" } },
  { id: "d4", name: "Onion", sku: "ONI-1KG", sellingPrice: 28, uom: "kg", category: { name: "Fruits & Veg" } },
  { id: "d5", name: "Tomato", sku: "TOM-1KG", sellingPrice: 40, uom: "kg", category: { name: "Fruits & Veg" } },
  { id: "d6", name: "Cucumber", sku: "CUC-1KG", sellingPrice: 25, uom: "kg", category: { name: "Fruits & Veg" } },
  { id: "d7", name: "Basmati Rice", sku: "RIC-1KG", sellingPrice: 120, uom: "kg", category: { name: "Grocery" } },
  { id: "d8", name: "Sunflower Oil", sku: "OIL-1L", sellingPrice: 160, uom: "pcs", category: { name: "Grocery" } },
  { id: "d9", name: "Milk", sku: "MLK-1L", sellingPrice: 70, uom: "pcs", category: { name: "Dairy" } },
  { id: "d10", name: "Eggs (Dozen)", sku: "EGG-DOZ", sellingPrice: 130, uom: "dozen", category: { name: "Dairy" } },
  { id: "d11", name: "Sugar", sku: "SUG-1KG", sellingPrice: 70, uom: "kg", category: { name: "Grocery" } },
  { id: "d12", name: "Atta", sku: "ATT-1KG", sellingPrice: 50, uom: "kg", category: { name: "Grocery" } },
  { id: "d13", name: "Lays Classic", sku: "LAY-52G", sellingPrice: 35, uom: "pcs", category: { name: "Snacks" } },
  { id: "d14", name: "Coca-Cola", sku: "COC-1L5", sellingPrice: 110, uom: "pcs", category: { name: "Beverages" } },
  { id: "d15", name: "Nescafe", sku: "NES-50G", sellingPrice: 115, uom: "pcs", category: { name: "Beverages" } },
  { id: "d16", name: "Surf Excel", sku: "SUR-1KG", sellingPrice: 190, uom: "kg", category: { name: "Household" } },
  { id: "d17", name: "Toilet Tissue", sku: "TIS-4P", sellingPrice: 60, uom: "pcs", category: { name: "Household" } },
  { id: "d18", name: "Detergent", sku: "DET-1KG", sellingPrice: 120, uom: "kg", category: { name: "Household" } },
  { id: "d19", name: "White Bread", sku: "BRD-400G", sellingPrice: 45, uom: "pcs", category: { name: "Bakery" } },
  { id: "d20", name: "Butter Croissant", sku: "CRO-2P", sellingPrice: 85, uom: "pcs", category: { name: "Bakery" } },
  { id: "d21", name: "Chocolate Cake", sku: "CAK-500G", sellingPrice: 350, uom: "pcs", category: { name: "Bakery" } },
  { id: "d22", name: "Frozen Pizza", sku: "PIZ-350G", sellingPrice: 290, uom: "pcs", category: { name: "Frozen Foods" } },
  { id: "d23", name: "Ice Cream", sku: "ICE-1L", sellingPrice: 220, uom: "pcs", category: { name: "Frozen Foods" } },
  { id: "d24", name: "Chicken Nuggets", sku: "NUG-500G", sellingPrice: 260, uom: "pcs", category: { name: "Frozen Foods" } },
  { id: "d25", name: "Fresh Salmon", sku: "SAL-1KG", sellingPrice: 850, uom: "kg", category: { name: "Meat & Fish" } },
  { id: "d26", name: "Beef Steak", sku: "STE-1KG", sellingPrice: 750, uom: "kg", category: { name: "Meat & Fish" } },
  { id: "d27", name: "Body Wash", sku: "WAS-500M", sellingPrice: 240, uom: "pcs", category: { name: "Personal Care" } },
  { id: "d28", name: "Shampoo", sku: "SHA-350M", sellingPrice: 280, uom: "pcs", category: { name: "Personal Care" } },
  { id: "d29", name: "Baby Powder", sku: "BAB-200G", sellingPrice: 310, uom: "pcs", category: { name: "Baby Care" } },
  { id: "d30", name: "Cat Food", sku: "CAT-1KG", sellingPrice: 420, uom: "pcs", category: { name: "Pet Supplies" } },
];

const DEMO_CART: CartItem[] = [
  { id: "c1", productId: "d7", name: "Basmati Rice (1kg)", sku: "RIC-1KG", unitPrice: 120, qty: 1, lineTotal: 120, discountPct: 0, uom: "kg" },
  { id: "c2", productId: "d8", name: "Sunflower Oil (1L)", sku: "OIL-1L", unitPrice: 160, qty: 1, lineTotal: 160, discountPct: 5, uom: "pcs" },
  { id: "c3", productId: "d11", name: "Sugar (1kg)", sku: "SUG-1KG", unitPrice: 70, qty: 1, lineTotal: 70, discountPct: 2, uom: "kg" },
  { id: "c4", productId: "d1", name: "Banana (1kg)", sku: "BAN-1KG", unitPrice: 60, qty: 2, lineTotal: 120, discountPct: 0, uom: "kg" },
  { id: "c5", productId: "d10", name: "Eggs (Dozen)", sku: "EGG-DOZ", unitPrice: 130, qty: 1, lineTotal: 130, discountPct: 0, uom: "dozen" },
  { id: "c6", productId: "d14", name: "Coca-Cola (1.5L)", sku: "COC-1L5", unitPrice: 110, qty: 1, lineTotal: 110, discountPct: 0, uom: "pcs" },
  { id: "c7", productId: "d13", name: "Lays Classic (52g)", sku: "LAY-52G", unitPrice: 35, qty: 1, lineTotal: 35, discountPct: 10, uom: "pcs" },
];

const PAY_CFG = [
  { id: "Cash", label: "Cash", Icon: Camera, bg: "bg-[#f0fdf4]", border: "border-[#dcfce7]", text: "text-[#15803d]", activeBorder: "border-[#16a34a]", activeRing: "ring-2 ring-[#16a34a]/30" },
  { id: "Card", label: "Card", Icon: CreditCard, bg: "bg-[#eff6ff]", border: "border-[#dbeafe]", text: "text-[#1d4ed8]", activeBorder: "border-[#2563eb]", activeRing: "ring-2 ring-[#2563eb]/30" },
  { id: "UPI / QR", label: "UPI / QR", Icon: Grid, bg: "bg-[#faf5ff]", border: "border-[#ede9fe]", text: "text-[#7c3aed]", activeBorder: "border-[#9333ea]", activeRing: "ring-2 ring-[#9333ea]/30" },
  { id: "Wallet", label: "Wallet", Icon: Wallet, bg: "bg-[#fff7ed]", border: "border-[#ffedd5]", text: "text-[#c2410c]", activeBorder: "border-[#ea580c]", activeRing: "ring-2 ring-[#ea580c]/30" },
  { id: "Split Payment", label: "Split Payment", Icon: Layers, bg: "bg-[#e6f4f1]", border: "border-[#ccfbf1]", text: "text-[#0d9488]", activeBorder: "border-[#0d9488]", activeRing: "ring-2 ring-[#0d9488]/30" },
] as const;

const FN_KEYS = [
  { label: "Price Check", key: "F3", Icon: Search },
  { label: "Barcode Lookup", key: "F4", Icon: ScanLine },
  { label: "Recent Sales", key: "F5", Icon: History },
  { label: "Return/Refund", key: "F6", Icon: RotateCcw },
] as const;

const NUM_KEYS = ["7", "8", "9", "⌫", "4", "5", "6", "+", "1", "2", "3", "−", "0", "00", ".", "="] as const;

export default function GroceryPOSPage() {
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>(DEMO_CART);
  const [scanInput, setScanInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedCat, setSelectedCat] = useState("All Items");
  const [moreOpen, setMoreOpen] = useState(false);
  const [heldCarts, setHeldCarts] = useState<{ id: string; time: string; items: CartItem[] }[]>([]);
  const [payMethod, setPayMethod] = useState<"Cash" | "Card" | "UPI / QR" | "Wallet" | "Split Payment">("Cash");
  const [submitting, setSubmitting] = useState(false);
  const [completedInv, setCompletedInv] = useState<any | null>(null);
  const [discountPct, setDiscountPct] = useState("0.00");
  const [couponCode, setCouponCode] = useState("");
  const [salesNote, setSalesNote] = useState("");
  const [numBuf, setNumBuf] = useState("");
  const [numTarget, setNumTarget] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [scaleOpen, setScaleOpen] = useState(false);
  const [scaleProd, setScaleProd] = useState<Product | null>(null);
  const [grossKg, setGrossKg] = useState("1.000");

  // Additional Modal States
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState({ name: "Walk-in Customer", type: "Default Customer", points: 120, phone: "01700000000" });
  const [priceCheckOpen, setPriceCheckOpen] = useState(false);
  const [priceCheckQuery, setPriceCheckQuery] = useState("");
  const [recentSalesOpen, setRecentSalesOpen] = useState(false);
  const [stockCheckOpen, setStockCheckOpen] = useState(false);
  const [offersOpen, setOffersOpen] = useState(false);
  const [heldCartsOpen, setHeldCartsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerToast, setDrawerToast] = useState(false);
  const [couponToast, setCouponToast] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Hardware Settings State matching reference image (Kitchen printer removed, Scanner Audio Beep included)
  const [hardwareSettings, setHardwareSettings] = useState({
    receiptPrinter: true,
    cashDrawer: true,
    barcodeScanner: true,
    scannerBeep: true,
    cardTerminal: false,
    customerDisplay: false,
  });

  const [salesHistory, setSalesHistory] = useState<any[]>([
    { invoiceNo: "GRO-889102", date: "Today, 04:32 PM", grandTotal: 450, itemsCount: 3, paymentMethod: "Cash", customer: "Walk-in Customer", items: DEMO_CART.slice(0, 3) },
    { invoiceNo: "GRO-889098", date: "Today, 03:15 PM", grandTotal: 1250, itemsCount: 6, paymentMethod: "Card", customer: "Rahim Ahmed", items: DEMO_CART.slice(2, 7) },
    { invoiceNo: "GRO-889075", date: "Today, 01:40 PM", grandTotal: 320, itemsCount: 2, paymentMethod: "UPI / QR", customer: "Sharmin Sultana", items: DEMO_CART.slice(0, 2) },
  ]);

  const scanRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const couponInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  const loadProducts = useCallback(async () => {
    try {
      const res: any = await api.get("/products", { params: { limit: 300 } });
      const d = res?.data?.data ?? res?.data ?? res ?? [];
      const arr: Product[] = Array.isArray(d) ? d : [];
      if (arr.length > 0) setProducts(arr);
    } catch { }
  }, []);
  useEffect(() => { loadProducts(); scanRef.current?.focus(); }, [loadProducts]);

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const playBeep = () => {
    if (!soundEnabled || !hardwareSettings.scannerBeep) return;
    try {
      const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(1400, ctx.currentTime);
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.07);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.07);
    } catch { }
  };

  const triggerCashDrawer = () => {
    playBeep();
    setDrawerToast(true);
    setTimeout(() => setDrawerToast(false), 2500);
  };

  const applyCouponCode = (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;
    if (code === "SAVE10" || code === "FRESH10") {
      setDiscountPct("10.00");
      setCouponCode(code);
      setCouponToast("🎉 10% Discount Coupon Applied!");
    } else if (code === "FLAT50" || code === "WELCOME15") {
      setDiscountPct("15.00");
      setCouponCode(code);
      setCouponToast("🎉 15% Special Coupon Applied!");
    } else if (code === "SUPER20") {
      setDiscountPct("20.00");
      setCouponCode(code);
      setCouponToast("🚀 20% Super Sale Coupon Applied!");
    } else {
      setCouponToast("⚠️ Invalid or expired coupon code");
    }
    setTimeout(() => setCouponToast(""), 3000);
  };

  const addToCart = (prod: Product, qty = 1, isWeighed = false, weightKg?: number) => {
    playBeep();
    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === prod.id && !i.isWeighed && !isWeighed);
      if (idx >= 0 && !isWeighed) { const copy = [...prev]; const nq = copy[idx].qty + qty; copy[idx] = { ...copy[idx], qty: nq, lineTotal: nq * copy[idx].unitPrice }; return copy; }
      const aq = isWeighed ? (weightKg || 1) : qty; const up = Number(prod.sellingPrice || 0);
      return [{ id: `${prod.id}-${Date.now()}`, productId: prod.id, name: prod.name, sku: prod.sku, barcode: prod.barcode, unitPrice: up, qty: aq, isWeighed, weightKg: isWeighed ? weightKg : undefined, lineTotal: aq * up, discountPct: 0, uom: prod.uom }, ...prev];
    });
    setScanInput(""); scanRef.current?.focus();
  };

  const updateQty = (id: string, delta: number) => setCart(prev => prev.map(i => { if (i.id !== id) return i; const nq = Math.max(i.isWeighed ? 0.05 : 1, Number((i.qty + delta).toFixed(3))); return { ...i, qty: nq, lineTotal: nq * i.unitPrice }; }).filter(i => i.qty > 0));
  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => { setCart([]); setDiscountPct("0.00"); setCouponCode(""); setSalesNote(""); };

  const holdCart = () => { if (!cart.length) return; setHeldCarts(prev => [...prev, { id: `HOLD-${Date.now().toString().slice(-4)}`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), items: cart }]); clearCart(); setCouponToast("📌 Bill Held Successfully"); setTimeout(() => setCouponToast(""), 2500); };
  const recallCart = (h: { id: string; items: CartItem[] }) => { setCart(h.items); setHeldCarts(prev => prev.filter(x => x.id !== h.id)); setHeldCartsOpen(false); };
  const openScale = (prod: Product) => { setScaleProd(prod); setGrossKg("1.000"); setScaleOpen(true); };
  const confirmScale = () => { if (!scaleProd) return; const net = Math.max(0.001, parseFloat(grossKg) || 0); addToCart(scaleProd, net, true, net); setScaleOpen(false); setScaleProd(null); };

  const handleScanKey = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key !== "Enter") return; e.preventDefault(); const code = scanInput.trim().toLowerCase(); if (!code) return; const found = products.find(p => (p.barcode?.toLowerCase() === code) || (p.sku?.toLowerCase() === code) || p.name.toLowerCase() === code); if (found) { const isKg = found.uom?.toLowerCase().includes("kg") || found.uom?.toLowerCase().includes("gm"); if (isKg) openScale(found); else addToCart(found); } else alert(`Barcode "${scanInput}" not found.`); setScanInput(""); };

  const numPress = (key: string) => {
    if (key === "⌫") { setNumBuf(p => p.slice(0, -1)); return; }
    if (key === "=") { if (numTarget) { const v = parseFloat(numBuf); if (!isNaN(v) && v > 0) setCart(prev => prev.map(i => i.id === numTarget ? { ...i, qty: v, lineTotal: v * i.unitPrice } : i)); } setNumTarget(null); setNumBuf(""); return; }
    if (key === "C") { setNumBuf(""); setNumTarget(null); return; }
    setNumBuf(p => p + key);
  };

  const subTotal = cart.reduce((a, i) => a + i.lineTotal, 0);
  const discAmt = subTotal * (parseFloat(discountPct) / 100 || 0);
  const totalItems = cart.length;
  const totalQty = cart.reduce((a, i) => a + i.qty, 0);
  const grandTotal = Math.max(0, subTotal - discAmt);

  const handleCheckout = async () => {
    if (!cart.length) return;
    setSubmitting(true);
    try {
      const res: any = await api.post("/pos/sales", { paymentMethod: payMethod, items: cart.map(i => ({ productId: i.productId, qty: i.qty, unitPrice: i.unitPrice, lineTotal: i.lineTotal })), subTotal, grandTotal, notes: salesNote || `Grocery POS · ${payMethod}` });
      const inv = res?.data?.data ?? res?.data ?? res ?? {};
      const invNo = inv.invoiceNo || `GRO-${Date.now().toString().slice(-6)}`;
      const completedRecord = { invoiceNo: invNo, items: [...cart], grandTotal, subTotal, discAmt, paymentMethod: payMethod, customer: selectedCustomer.name, date: new Date().toLocaleString() };
      setCompletedInv(completedRecord);
      setSalesHistory(prev => [completedRecord, ...prev]);
      clearCart();
    } catch {
      const invNo = `GRO-${Date.now().toString().slice(-6)}`;
      const completedRecord = { invoiceNo: invNo, items: [...cart], grandTotal, subTotal, discAmt, paymentMethod: payMethod, customer: selectedCustomer.name, date: new Date().toLocaleString() };
      setCompletedInv(completedRecord);
      setSalesHistory(prev => [completedRecord, ...prev]);
      clearCart();
    } finally {
      setSubmitting(false);
    }
  };

  // Global Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        if (e.key === "Escape") (document.activeElement as HTMLElement).blur();
        return;
      }
      if (e.key === "F3") { e.preventDefault(); setPriceCheckOpen(true); }
      else if (e.key === "F4") { e.preventDefault(); scanRef.current?.focus(); }
      else if (e.key === "F5") { e.preventDefault(); setStockCheckOpen(true); }
      else if (e.key === "F6") { e.preventDefault(); setOffersOpen(true); }
      else if (e.key === "F7") { e.preventDefault(); if (cart.length) holdCart(); else setHeldCartsOpen(true); }
      else if (e.key === "F8") { e.preventDefault(); setRecentSalesOpen(true); }
      else if (e.key === "F9") { e.preventDefault(); triggerCashDrawer(); }
      else if (e.key === "F10") { e.preventDefault(); setCustomerModalOpen(true); }
      else if (e.key === "F11") { e.preventDefault(); clearCart(); }
      else if (e.key === "F12") { e.preventDefault(); window.print(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, payMethod]);

  const MAIN_CATS = ["All Items", "Fruits & Veg", "Grocery", "Beverages", "Snacks", "Dairy", "Household"];
  const MORE_CATS = ["Bakery", "Frozen Foods", "Meat & Fish", "Personal Care", "Baby Care", "Pet Supplies"];
  const CATS = [...MAIN_CATS, ...MORE_CATS];
  const CAT_ICON_MAP: Record<string, { icon: React.ReactNode; color: string }> = {
    "All Items": { icon: <Grid size={15} />, color: "text-emerald-600" },
    "Fruits & Veg": { icon: <Apple size={15} />, color: "text-emerald-500" },
    "Grocery": { icon: <ShoppingBag size={15} />, color: "text-orange-500" },
    "Beverages": { icon: <Coffee size={15} />, color: "text-blue-500" },
    "Snacks": { icon: <Package size={15} />, color: "text-amber-500" },
    "Dairy": { icon: <Star size={15} />, color: "text-sky-500" },
    "Household": { icon: <Home size={15} />, color: "text-indigo-500" },
    "Bakery": { icon: <Utensils size={15} />, color: "text-amber-600" },
    "Frozen Foods": { icon: <Snowflake size={15} />, color: "text-cyan-500" },
    "Meat & Fish": { icon: <Fish size={15} />, color: "text-rose-500" },
    "Personal Care": { icon: <Sparkles size={15} />, color: "text-pink-500" },
    "Baby Care": { icon: <Heart size={15} />, color: "text-red-400" },
    "Pet Supplies": { icon: <ShieldCheck size={15} />, color: "text-emerald-700" },
  };
  const filteredProducts = products.filter(p => { const matchCat = selectedCat === "All Items" || (p.category?.name || "Grocery") === selectedCat; const q = searchFilter.toLowerCase().trim(); return matchCat && (!q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcode?.includes(q)); });

  return (
    <div className="relative flex flex-col h-screen w-screen bg-white select-none overflow-hidden" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ══ VIVID ORGANIC CURVED WAVE BACKDROP (Matching User Image Footer) ══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Upper Soft Mint Wave — Rises under Status Bar */}
        <svg className="absolute bottom-0 left-0 w-[70%] h-[280px] opacity-95" viewBox="0 0 1000 280" fill="none" preserveAspectRatio="none">
          <path d="M 0 110 C 180 200, 380 20, 680 160 C 830 220, 940 70, 1000 110 L 1000 280 L 0 280 Z" fill="url(#mint-wave-top)" />
          <defs>
            <linearGradient id="mint-wave-top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#eefce3" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#dcfce7" stopOpacity="0.7" />
              <stop offset="85%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Main Vivid Lime-Green Front Wave — Matches Image 2 bottom-left wave! */}
        <svg className="absolute bottom-0 left-0 w-[62%] h-[210px] opacity-100" viewBox="0 0 1000 210" fill="none" preserveAspectRatio="none">
          <path d="M 0 45 C 160 165, 360 15, 630 140 C 790 195, 910 85, 1000 125 L 1000 210 L 0 210 Z" fill="url(#lime-wave-vivid)" />
          <defs>
            <linearGradient id="lime-wave-vivid" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d9f99d" stopOpacity="1" />
              <stop offset="30%" stopColor="#bef264" stopOpacity="0.9" />
              <stop offset="65%" stopColor="#dcfce7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Bottom Left Deep Yellow-Green Glow Wave */}
        <svg className="absolute -bottom-2 -left-4 w-[48%] h-[150px] opacity-95" viewBox="0 0 800 150" fill="none" preserveAspectRatio="none">
          <path d="M 0 25 C 130 125, 290 5, 520 105 C 670 155, 760 65, 800 95 L 800 150 L 0 150 Z" fill="url(#lime-wave-glow)" />
          <defs>
            <linearGradient id="lime-wave-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a3e635" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#d9f99d" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ══ HEADER — Pure White Background ══ */}
      <header className="relative z-10 flex-none flex items-center justify-between gap-4 px-6 py-3 border-b border-gray-200 bg-white shadow-xs" style={{ minHeight: 64 }}>
        <div className="flex items-center gap-3">
          <Link href="/grocery" className="flex items-center text-slate-700 hover:text-slate-900 transition mr-1"><ChevronLeft size={18} /></Link>
          <div className="flex items-center gap-2.5">
            <div className="relative text-emerald-600"><ShoppingCart size={30} strokeWidth={2.2} /><div className="absolute -top-1 -right-1 text-emerald-700 font-bold text-xs">🌿</div></div>
            <div className="leading-tight">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">FreshMart</h1>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">POS SYSTEM</p>
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-xl">
          <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 shadow-inner px-4 py-2">
            <Search size={18} className="text-slate-400 shrink-0 mr-3" />
            <input ref={scanRef} type="text" value={scanInput} onChange={e => { setScanInput(e.target.value); setSearchFilter(e.target.value); }} onKeyDown={handleScanKey}
              placeholder="Search product by name, barcode or scan..."
              className="w-full bg-transparent text-sm font-semibold text-gray-800 placeholder:text-gray-400 placeholder:font-normal focus:outline-none" />
            <ScanLine size={18} className="text-emerald-600 shrink-0 ml-2" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[
            { icon: <Users size={15} strokeWidth={2.5} />, bg: "bg-slate-100 text-slate-700", label: selectedCustomer.name, sub: selectedCustomer.type, onClick: () => setCustomerModalOpen(true) },
            { icon: <span className="text-xs font-bold">★</span>, bg: "bg-emerald-600 text-white shadow-xs animate-pulse", label: "Loyalty Points", sub: `${selectedCustomer.points} Pts`, onClick: () => setCustomerModalOpen(true) },
            { icon: <FileText size={15} strokeWidth={2.2} />, bg: "bg-slate-100 text-slate-700", label: "Invoice", sub: "INV-250520-0012", onClick: () => setRecentSalesOpen(true) },
            { icon: <Clock size={15} strokeWidth={2.2} />, bg: "bg-slate-100 text-slate-700 relative", label: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), sub: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
          ].map((c, i) => (
            <div key={i} onClick={c.onClick} className="flex items-center gap-2.5 bg-white rounded-2xl px-3.5 py-2 border border-gray-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${c.bg}`}>{c.icon}</div>
              <div className="leading-tight">
                <p className="text-xs font-extrabold text-slate-800 whitespace-nowrap">{c.label}</p>
                <p className="text-[10px] font-semibold text-slate-500">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div className="relative z-10 flex-1 min-h-0 flex overflow-hidden">

        {/* ════ LEFT — Product Grid ════ */}
        <div className="flex flex-col w-[65%] min-w-0 overflow-hidden border-r border-gray-200 shrink-0">

          {/* Category tabs */}
          <div className="flex-none bg-white border-b border-gray-200 px-3 py-2.5">
            <div className="grid grid-cols-8 gap-1.5 w-full">
              {MAIN_CATS.map(cat => {
                const on = selectedCat === cat;
                const item = CAT_ICON_MAP[cat] || { icon: <Package size={15} />, color: "text-emerald-600" };
                return (
                  <button key={cat} onClick={() => { setSelectedCat(cat); setMoreOpen(false); }}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-2xl text-xs font-black transition-all duration-200 transform truncate ${on
                        ? "bg-emerald-600 text-white shadow-md scale-[1.03] active:scale-95"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5 shadow-2xs active:scale-95"
                      }`}>
                    <span className={on ? "text-white shrink-0" : `${item.color} shrink-0`}>{item.icon}</span>
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}

              {/* More Categories Button */}
              <button onClick={() => setMoreOpen(p => !p)}
                className={`flex items-center justify-center gap-1 px-2 py-2 rounded-2xl text-xs font-black transition-all duration-200 transform truncate ${MORE_CATS.includes(selectedCat) || moreOpen
                    ? "bg-emerald-600 text-white shadow-md scale-[1.03]"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5 shadow-2xs active:scale-95"
                  }`}>
                <span className="truncate">••• More {MORE_CATS.includes(selectedCat) ? `(${selectedCat})` : ""}</span>
                <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {/* Inline Expanded Category Drawer */}
          {moreOpen && (
            <div className="flex-none bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2 flex-wrap shadow-inner animate-in fade-in slide-in-from-top-1">
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider mr-1">
                More Categories:
              </span>
              {MORE_CATS.map(cat => {
                const on = selectedCat === cat;
                const count = products.filter(p => p.category?.name === cat).length;
                const item = CAT_ICON_MAP[cat] || { icon: <Package size={14} />, color: "text-emerald-600" };
                return (
                  <button key={cat} onClick={() => { setSelectedCat(cat); setMoreOpen(false); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all transform hover:scale-105 active:scale-95 ${on
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-100"
                      }`}>
                    <span className={on ? "text-white" : item.color}>{item.icon}</span>
                    <span>{cat}</span>
                    <span className={`text-[10px] font-mono rounded px-1 py-0.5 ${on ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick actions */}
          <div className="flex-none bg-white border-b border-gray-200 px-4 py-2.5">
            <p className="text-xs font-bold text-slate-700 mb-2">Quick Actions</p>
            <div className="flex items-center gap-2.5">
              {[
                { label: "Price Check", key: "F3", icon: <Search size={15} />, onClick: () => setPriceCheckOpen(true) },
                { label: "Recent Items", key: "F4", icon: <Clock size={15} />, onClick: () => scanRef.current?.focus() },
                { label: "Stock Check", key: "F5", icon: <Package size={15} />, onClick: () => setStockCheckOpen(true) },
                { label: "Offers", key: "F6", icon: <Tag size={15} />, onClick: () => setOffersOpen(true) },
                { label: "Hold Bill", key: "F7", icon: <PauseCircle size={15} />, onClick: () => { if (cart.length) holdCart(); else setHeldCartsOpen(true); } },
              ].map(a => (
                <button key={a.label} onClick={a.onClick}
                  className="flex-1 bg-white rounded-xl border border-gray-200 p-2 flex items-center gap-2 shadow-2xs hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98] transition-all duration-150 text-left group cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
                    {a.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate leading-snug group-hover:text-emerald-700 transition-colors">{a.label}</p>
                    <span className="text-[10px] font-semibold font-mono text-slate-700 bg-gray-100 border border-gray-200 px-1.5 py-0.2 rounded inline-block mt-0.5">{a.key}</span>
                  </div>
                </button>
              ))}
              <button onClick={() => setSettingsOpen(true)} className="p-2.5 rounded-xl border border-gray-200 bg-white text-slate-600 hover:text-emerald-700 hover:border-gray-300 hover:shadow-md active:translate-y-0.5 active:scale-95 shadow-2xs shrink-0 transition-all cursor-pointer">
                <Settings size={17} />
              </button>
            </div>
          </div>

          {/* Sub-header */}
          <div className="flex-none px-4 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide">All Products ({filteredProducts.length})</h2>
            <button onClick={() => { setSelectedCat("All Items"); setSearchFilter(""); }} className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
          </div>

          {/* Product grid - 6 Columns (Clean White 3D Product Cards) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 bg-transparent">
            <div className="grid grid-cols-6 gap-3">
              {filteredProducts.map(p => {
                const isKg = p.uom?.toLowerCase().includes("kg") || p.uom?.toLowerCase().includes("gm");
                const emoji = getEmoji(p.name); const bg = getEmojiColor(emoji);
                const cartItem = cart.find(c => c.id === p.id);
                const inCartQty = cartItem ? cartItem.qty : 0;

                return (
                  <button key={p.id} onClick={() => isKg ? openScale(p) : addToCart(p)}
                    className={`flex flex-col rounded-2xl border border-gray-200 shadow-2xs hover:shadow-md hover:border-emerald-500 hover:-translate-y-1 active:translate-y-0.5 active:scale-[0.98] transition-all duration-200 overflow-hidden p-2.5 text-left group cursor-pointer relative bg-white ${inCartQty > 0
                        ? "ring-2 ring-emerald-500 border-emerald-500"
                        : ""
                      }`}>

                    {/* Floating Cart Quantity Badge */}
                    {inCartQty > 0 && (
                      <div className="absolute top-2 right-2 z-20 bg-emerald-600 text-white text-[9.5px] font-bold px-2 py-0.5 rounded-full shadow-2xs border border-white/80 animate-in zoom-in-75">
                        {inCartQty} in cart
                      </div>
                    )}

                    {/* Pure White Square Emoji Showcase */}
                    <div className="w-full h-20 sm:h-22 aspect-square flex items-center justify-center rounded-xl text-[38px] leading-none mb-2 select-none group-hover:scale-108 transition-all duration-200 border border-gray-100 bg-white relative overflow-hidden shrink-0 shadow-2xs">
                      <span className="relative z-10 drop-shadow-xs select-none">{emoji}</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors leading-snug tracking-tight">{p.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] font-semibold font-mono text-slate-600 bg-gray-100 border border-gray-200 px-1.5 py-0.2 rounded">{p.uom || "1kg"}</span>
                          {isKg && <span className="text-[9px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1 rounded">Scale</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-gray-100">
                        <span className="text-xs font-extrabold text-slate-900 bg-white border border-gray-200 px-2 py-0.5 rounded-lg shadow-2xs">
                          ৳ {Number(p.sellingPrice).toFixed(2)}
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-110 group-hover:bg-emerald-500 transition-all duration-200">
                          <Plus size={13} strokeWidth={2.5} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="col-span-6 py-12 text-center bg-white rounded-2xl border border-gray-200 shadow-2xs">
                  <Package size={36} className="mx-auto mb-2 opacity-40 text-gray-400" />
                  <p className="text-xs font-bold text-gray-500">No products found</p>
                </div>
              )}
            </div>
          </div>

          {/* Status & Action Bars Container */}
          <div className="flex-none bg-transparent p-3 flex flex-col gap-2.5 relative z-10">

            {/* Status Summary Bar — Pure White */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md px-4 py-2.5 flex items-center justify-between divide-x divide-gray-100">
              {[
                { icon: <ShoppingBag size={16} />, label: "Total Items", val: totalItems, bg: "bg-slate-100 text-slate-700 border border-slate-200" },
                { icon: <Package size={16} />, label: "Total Qty", val: Math.round(totalQty * 100) / 100, bg: "bg-slate-100 text-slate-700 border border-slate-200" },
                { icon: <FileText size={16} />, label: "Subtotal", val: fmt(subTotal), bg: "bg-slate-100 text-slate-700 border border-slate-200" },
                { icon: <Tag size={16} />, label: "Discount", val: fmt(discAmt), bg: "bg-slate-100 text-slate-700 border border-slate-200" },
                { icon: <Gift size={16} />, label: "Total Savings", val: fmt(discAmt), bg: "bg-slate-100 text-slate-700 border border-slate-200" },
              ].map((s, idx) => (
                <div key={s.label} className={`flex items-center gap-2.5 ${idx === 0 ? "" : "pl-3.5"} ${idx === 4 ? "" : "pr-3.5"} flex-1`}>
                  <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center shrink-0 shadow-2xs`}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-tight">{s.label}</p>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-800 leading-snug mt-0.5">{s.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Action Bar (5 Distinct Tactile White Buttons) */}
            <div className="grid grid-cols-5 gap-2.5">
              {[
                { label: "Sales History", key: "F8", icon: <History size={16} />, onClick: () => setRecentSalesOpen(true) },
                { label: "Open Drawer", key: "F9", icon: <Printer size={16} />, onClick: triggerCashDrawer },
                { label: "Add Customer", key: "F10", icon: <Users size={16} />, onClick: () => setCustomerModalOpen(true) },
                { label: "Clear Cart", key: "F11", icon: <Trash2 size={16} />, isDanger: true, onClick: clearCart },
                { label: "Save & Print", key: "F12", icon: <Printer size={16} />, onClick: () => window.print() },
              ].map((a) => (
                <button key={a.label} onClick={a.onClick}
                  className={`border rounded-xl p-2 flex items-center justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98] transition-all duration-150 text-left group overflow-hidden cursor-pointer bg-white ${a.isDanger
                      ? "border-red-200 hover:border-red-500"
                      : "border-gray-200 hover:border-gray-400"
                    }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-lg bg-gray-50 border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-all duration-200 ${a.isDanger ? "border-red-200 text-red-600 group-hover:bg-red-600 group-hover:text-white" : "border-gray-200 text-slate-700 group-hover:bg-slate-900 group-hover:text-white"
                      }`}>
                      {a.icon}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate leading-snug transition-colors ${a.isDanger ? "text-red-900 group-hover:text-red-700" : "text-slate-800 group-hover:text-slate-900"}`}>{a.label}</p>
                      <span className={`text-[9.5px] font-mono font-semibold px-1.5 py-0.2 rounded inline-block mt-0.5 border ${a.isDanger ? "bg-red-600 text-white border-red-700/50" : "bg-emerald-700 text-white border-emerald-800/50"
                        }`}>{a.key}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* ════ RIGHT — Cart / Summary / Payment ════ */}
        <div className="flex flex-col gap-2 p-2 bg-transparent border-l border-emerald-100/50 overflow-hidden shrink-0 w-[35%] relative z-10" style={{ width: "35%" }}>

          {/* ── 1. CART CARD — flex-1 so it fills remaining space ── */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col flex-1 min-h-0">

            {/* Cart header */}
            <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">Cart</h2>
                <span className="text-emerald-600 font-bold text-xs">({totalItems} Items)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => { if (cart.length) holdCart(); else setHeldCartsOpen(true); }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-bold transition cursor-pointer ${heldCarts.length > 0 ? "border-amber-300 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/70"
                    }`}>
                  Hold (F7) {heldCarts.length > 0 ? `(${heldCarts.length})` : ""}
                </button>
                <button onClick={clearCart} disabled={!cart.length}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-red-200 bg-red-50/70 text-xs font-bold text-red-600 hover:bg-red-100 transition disabled:opacity-40 cursor-pointer">
                  <Trash2 size={12} /> Clear
                </button>
              </div>
            </div>

            {/* Table header */}
            <div className="shrink-0 grid px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 border-b border-gray-100"
              style={{ gridTemplateColumns: "1.8fr 1fr 0.9fr 0.9fr 0.9fr 26px" }}>
              <span>ITEM</span><span className="text-center">QTY</span><span className="text-right">PRICE</span>
              <span className="text-center">DISC</span><span className="text-right">TOTAL</span><span />
            </div>

            {/* Cart rows — flex-1 min-h-0 overflow-y-auto: scrolls internally */}
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-50">
              {cart.length === 0 ? (
                <div className="py-8 text-center">
                  <ShoppingCart size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500 font-bold">Cart is empty</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click products on left to add</p>
                </div>
              ) : cart.map(item => {
                const emoji = getEmoji(item.name); const bg = getEmojiColor(emoji);
                const lineFinal = item.discountPct ? item.lineTotal * (1 - item.discountPct / 100) : item.lineTotal;
                return (
                  <div key={item.id} onClick={() => setNumTarget(item.id)}
                    className={`grid items-center px-3 py-2 hover:bg-emerald-50/30 cursor-pointer transition ${numTarget === item.id ? "bg-emerald-50/60" : ""}`}
                    style={{ gridTemplateColumns: "1.8fr 1fr 0.9fr 0.9fr 0.9fr 26px" }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-sm leading-none" style={{ background: bg }}>{emoji}</div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate leading-tight">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">৳ {item.unitPrice.toFixed(2)} / {item.uom || "pcs"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="flex items-center bg-white border border-gray-200 rounded-lg px-1 py-0.5 shadow-2xs">
                        <button onClick={e => { e.stopPropagation(); updateQty(item.id, item.isWeighed ? -0.1 : -1); }} className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-900 font-bold text-xs flex-shrink-0 cursor-pointer">−</button>
                        <span className="w-6 text-center font-bold text-xs text-slate-800">{item.isWeighed ? item.qty.toFixed(1) : item.qty}</span>
                        <button onClick={e => { e.stopPropagation(); updateQty(item.id, item.isWeighed ? 0.1 : 1); }} className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-900 font-bold text-xs flex-shrink-0 cursor-pointer">+</button>
                      </div>
                    </div>
                    <div className="text-right text-xs font-semibold text-slate-700">৳ {item.unitPrice.toFixed(2)}</div>
                    <div className="text-center">
                      {item.discountPct
                        ? <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded inline-block">{item.discountPct}%</span>
                        : <span className="text-slate-300">-</span>}
                    </div>
                    <div className="text-right text-xs font-bold text-emerald-700">৳ {lineFinal.toFixed(2)}</div>
                    <div className="text-right">
                      <button onClick={e => { e.stopPropagation(); removeItem(item.id); }}
                        className="w-5 h-5 rounded-full bg-gray-50 text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition border border-gray-200 cursor-pointer">
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart footer */}
            <div className="shrink-0 flex items-center justify-between px-3 py-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <button onClick={() => noteInputRef.current?.focus()} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 bg-white text-xs font-bold text-slate-700 hover:bg-gray-50 transition cursor-pointer">
                  <Plus size={12} className="text-emerald-600" /> Note
                </button>
                <button onClick={() => discountInputRef.current?.focus()} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 bg-white text-xs font-bold text-emerald-700 hover:bg-gray-50 transition cursor-pointer">
                  <Tag size={12} className="text-emerald-600" /> Discount
                </button>
                <button onClick={() => couponInputRef.current?.focus()} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 bg-white text-xs font-bold text-rose-600 hover:bg-gray-50 transition cursor-pointer">
                  <Gift size={12} className="text-rose-500" /> Coupon
                </button>
              </div>
              <div className="text-xs font-bold text-slate-700">
                Items: <b className="text-slate-900">{totalItems}</b> <span className="ml-2">Qty: <b className="text-slate-900">{Math.round(totalQty * 100) / 100}</b></span>
              </div>
            </div>
          </div>

          {/* ── 2. MIDDLE — Discount+Note | Financial Summary ── shrink-0 */}
          <div className="shrink-0 grid grid-cols-2 gap-2">

            {/* Discount / Coupon / Note */}
            <div className="bg-gradient-to-b from-[#f2faf4] to-[#e6f7ec] rounded-xl p-2.5 border-t border-x border-[#e2f5e7] border-b-[2.5px] border-b-[#c8eed3] flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-700 w-14 shrink-0">Discount</span>
                <div className="flex-1 bg-white rounded-lg border border-gray-200 px-2 py-1 flex items-center shadow-2xs">
                  <input ref={discountInputRef} type="number" value={discountPct} onChange={e => setDiscountPct(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 text-right focus:outline-none pr-1" />
                  <span className="text-xs font-semibold text-slate-400">%</span>
                </div>
                <button onClick={() => { setCouponToast("Discount Percentage Updated!"); setTimeout(() => setCouponToast(""), 2500); }}
                  className="rounded-lg text-xs font-bold text-white px-2.5 py-1 shadow-xs transition hover:brightness-110 active:scale-95 cursor-pointer bg-emerald-600 border-b border-emerald-800">Apply</button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-700 w-14 shrink-0">Coupon</span>
                <div className="flex-1 bg-white rounded-lg border border-gray-200 px-2 py-1 flex items-center shadow-2xs">
                  <input ref={couponInputRef} type="text" value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="e.g. SAVE10"
                    className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none" />
                </div>
                <button onClick={() => applyCouponCode()}
                  className="rounded-lg text-xs font-bold text-white px-2.5 py-1 shadow-xs transition hover:brightness-110 active:scale-95 cursor-pointer bg-emerald-600 border-b border-emerald-800">Apply</button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-700 w-14 shrink-0">Note</span>
                <div className="flex-1 bg-white rounded-lg border border-gray-200 pl-2 pr-1 py-0.5 flex items-center shadow-2xs">
                  <input ref={noteInputRef} type="text" value={salesNote} onChange={e => setSalesNote(e.target.value)} placeholder="Add note..."
                    className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none" />
                  <div className="w-5 h-5 rounded bg-gray-50 flex items-center justify-center text-emerald-600 shrink-0 ml-1">
                    <AlignLeft size={11} />
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-gradient-to-b from-white via-emerald-50/30 to-emerald-100/40 rounded-xl px-3 py-2.5 border-t border-x border-emerald-200/90 border-b-[2.5px] border-b-emerald-300 shadow-2xs flex flex-col justify-between">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center text-slate-500 font-semibold">
                  <span>Subtotal</span><span className="text-slate-800 font-bold">৳ {subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 font-semibold">
                  <span>Discount</span><span className="text-emerald-700 font-bold">- ৳ {discAmt.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 font-semibold">
                  <span>VAT (0%)</span><span className="text-slate-800 font-bold">৳ 0.00</span>
                </div>
                <div className="pt-1.5 border-t border-dashed border-emerald-200 flex justify-between items-baseline">
                  <span className="text-base font-bold text-slate-900">Total</span>
                  <span className="text-xl font-extrabold text-emerald-600">৳ {grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-center py-1 px-2 rounded-lg font-bold text-xs">
                You Save ৳ {discAmt.toFixed(2)}
              </div>
            </div>
          </div>

          {/* ── 3. BOTTOM — Numpad | Payment + Pay CTA ── shrink-0 */}
          <div className="shrink-0 bg-white rounded-2xl border border-gray-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden" style={{ height: 210 }}>
            <div className="grid grid-cols-12 divide-x divide-gray-100 h-full">

              {/* LEFT: Function Keys + Numpad (5 columns) */}
              <div className="col-span-5 flex gap-1.5 p-2 overflow-hidden">
                <div className="flex flex-col gap-1 shrink-0 w-[100px]">
                  {[
                    { label: "Price Check", key: "F3", Icon: Search, onClick: () => setPriceCheckOpen(true) },
                    { label: "Barcode Lookup", key: "F4", Icon: ScanLine, onClick: () => scanRef.current?.focus() },
                    { label: "Recent Sales", key: "F5", Icon: History, onClick: () => setRecentSalesOpen(true) },
                    { label: "Return/Refund", key: "F6", Icon: RotateCcw, onClick: () => setRecentSalesOpen(true) },
                  ].map(({ label, key, Icon, onClick }) => (
                    <button key={key} onClick={onClick} className="flex items-center gap-1.5 px-2 rounded-xl bg-white border border-gray-200 border-b-[2.5px] border-b-gray-300 hover:border-gray-400 hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 active:scale-95 transition-all duration-150 flex-1 overflow-hidden text-left shadow-2xs group cursor-pointer">
                      <Icon size={13} className="text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-800 truncate leading-tight group-hover:text-slate-900">{label}</p>
                        <span className="text-[8px] font-bold font-mono bg-emerald-700 text-white px-1 py-0.2 rounded inline-block mt-0.5">{key}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex-1 grid grid-cols-4 gap-1 min-w-0">
                  {NUM_KEYS.map(k => (
                    <button key={k} onClick={() => numPress(k)}
                      className={`rounded-xl font-black text-sm flex items-center justify-center transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0.5 active:scale-90 cursor-pointer ${k === "=" ? "bg-gradient-to-b from-[#22c55e] via-[#16a34a] to-[#15803d] border-t border-x border-emerald-400 border-b-[3px] border-b-emerald-800 text-white shadow-md shadow-green-600/30 hover:brightness-110"
                          : k === "⌫" ? "bg-gradient-to-b from-white via-rose-50 to-red-100 text-red-600 border-t border-x border-red-200 border-b-[2.5px] border-b-red-300 hover:bg-red-100 hover:text-red-700 shadow-2xs"
                            : "bg-gradient-to-b from-white via-gray-50/50 to-gray-100/80 border-t border-x border-gray-200/90 border-b-[2.5px] border-b-gray-300 text-gray-800 hover:bg-gray-100 hover:border-gray-400 shadow-2xs"}`}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* RIGHT: Payment Pills (Vertical Column) + Pay CTA & Save & Print (7 columns) */}
              <div className="col-span-7 flex gap-2.5 p-2.5 overflow-hidden h-full">

                {/* 1. Left: 5 Vertical Payment Method Pills */}
                <div className="flex flex-col gap-1.5 shrink-0 w-[115px] h-full">
                  {PAY_CFG.map(pm => {
                    const on = payMethod === pm.id;
                    return (
                      <button key={pm.id} onClick={() => setPayMethod(pm.id as any)}
                        className={`flex-1 flex items-center gap-2 px-2.5 rounded-xl border-t border-x border-b-[2.5px] text-xs font-black transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0.5 active:scale-95 text-left min-w-0 cursor-pointer ${on
                            ? "bg-emerald-600 text-white border-emerald-700 border-b-emerald-800 shadow-sm scale-[1.02]"
                            : "bg-white border-gray-200 border-b-gray-300 text-gray-700 hover:border-gray-400"
                          }`}>
                        <pm.Icon size={15} className={`shrink-0 ${on ? "text-white" : "text-gray-500"}`} />
                        <span className="truncate leading-none">{pm.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 2. Right: Hero Pay CTA Box (Top) + Save & Print Bill (Bottom) */}
                <div className="flex-1 flex flex-col gap-2 min-w-0 h-full">

                  {/* Top: Hero Pay CTA Card */}
                  <button onClick={handleCheckout} disabled={!cart.length || submitting}
                    className="flex-1 w-full rounded-2xl text-white flex items-center justify-between px-3.5 sm:px-4 py-2.5 shadow-[0_8px_20px_rgba(22,163,74,0.35)] hover:shadow-[0_12px_28px_rgba(22,163,74,0.5)] hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-40 bg-gradient-to-b from-[#22c55e] via-[#16a34a] to-[#15803d] border-t border-x border-emerald-400 border-b-[4px] border-b-emerald-900 relative overflow-hidden group min-w-0 cursor-pointer">
                    <div className="text-left flex flex-col justify-center relative z-10 min-w-0 flex-1 mr-1.5">
                      <p className="text-xs sm:text-sm font-extrabold text-white/95 leading-none tracking-wide">Pay</p>
                      {(() => {
                        const str = grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        const len = str.length;
                        const sizeClass = len > 13 ? 'text-base sm:text-lg' : len > 10 ? 'text-lg sm:text-xl' : len > 7 ? 'text-xl sm:text-[24px]' : 'text-[24px] sm:text-[27px]';
                        return (
                          <p className={`${sizeClass} font-black text-white leading-tight tracking-tight mt-0.5 whitespace-nowrap`}>
                            ৳ {str}
                          </p>
                        );
                      })()}
                    </div>
                    <div className="relative z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/25 backdrop-blur-md border border-white/40 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 group-hover:bg-white/35 transition-all duration-300">
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowRight size={21} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
                      )}
                    </div>
                  </button>

                  {/* Bottom: Save & Print Bill */}
                  <button onClick={() => window.print()} disabled={!cart.length}
                    className="w-full py-2.5 rounded-xl border border-gray-200 border-b-[3px] border-b-gray-300 text-xs font-black flex items-center justify-center gap-2 transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0.5 active:scale-95 disabled:opacity-40 bg-white hover:bg-gray-50 text-slate-800 shadow-2xs shrink-0 cursor-pointer group">
                    <Printer size={15} className="shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">Save &amp; Print Bill</span>
                  </button>

                </div>

              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ══ CUSTOMER SELECTION MODAL ══ */}
      {customerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-[420px] rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 text-white flex items-center justify-between" style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
              <div className="flex items-center gap-2.5">
                <Users size={22} />
                <div>
                  <h3 className="font-extrabold text-base">Select Customer</h3>
                  <p className="text-xs opacity-80">Link sale to customer for loyalty points</p>
                </div>
              </div>
              <button onClick={() => setCustomerModalOpen(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                {[
                  { name: "Walk-in Customer", type: "Default Customer", points: 120, phone: "N/A" },
                  { name: "Rahim Ahmed", type: "VIP Member", points: 450, phone: "01812345678" },
                  { name: "Sharmin Sultana", type: "Premium Member", points: 890, phone: "01987654321" },
                  { name: "Tanvir Hossain", type: "Regular Customer", points: 210, phone: "01611223344" },
                ].map(c => (
                  <button key={c.name} onClick={() => { setSelectedCustomer(c); setCustomerModalOpen(false); setCouponToast(`Customer set to ${c.name}`); setTimeout(() => setCouponToast(""), 2500); }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${selectedCustomer.name === c.name ? "border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20" : "border-gray-200/80 bg-white hover:bg-gray-50"
                      }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900">{c.name}</p>
                        <p className="text-[10px] font-semibold text-gray-400">{c.phone} • {c.type}</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-xl">
                      ★ {c.points} Pts
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ PRICE CHECK MODAL ══ */}
      {priceCheckOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-[460px] rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 text-white flex items-center justify-between" style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
              <div className="flex items-center gap-2.5">
                <Search size={22} />
                <div>
                  <h3 className="font-extrabold text-base">Price &amp; Stock Check (F3)</h3>
                  <p className="text-xs opacity-80">Scan barcode or type item name</p>
                </div>
              </div>
              <button onClick={() => setPriceCheckOpen(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-3 text-gray-400" />
                <input type="text" autoFocus value={priceCheckQuery} onChange={e => setPriceCheckQuery(e.target.value)}
                  placeholder="Search product..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 focus:bg-white" />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {products.filter(p => !priceCheckQuery || p.name.toLowerCase().includes(priceCheckQuery.toLowerCase()) || p.sku.toLowerCase().includes(priceCheckQuery.toLowerCase())).slice(0, 6).map(p => (
                  <div key={p.id} className="p-3 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getEmoji(p.name)}</span>
                      <div>
                        <p className="text-xs font-black text-gray-900">{p.name}</p>
                        <p className="text-[10px] font-semibold text-gray-400">SKU: {p.sku} • {p.category?.name}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-sm font-black text-emerald-700">৳ {p.sellingPrice.toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-gray-400">Per {p.uom}</p>
                      </div>
                      <button onClick={() => { addToCart(p); setPriceCheckOpen(false); }} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition">
                        + Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ STOCK CHECK MODAL ══ */}
      {stockCheckOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-[500px] rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 text-white flex items-center justify-between" style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
              <div className="flex items-center gap-2.5">
                <Package size={22} />
                <div>
                  <h3 className="font-extrabold text-base">Inventory Stock Check (F5)</h3>
                  <p className="text-xs opacity-80">Real-time store stock availability</p>
                </div>
              </div>
              <button onClick={() => setStockCheckOpen(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 max-h-[380px] overflow-y-auto space-y-2">
              {products.slice(0, 10).map((p, i) => {
                const stockQty = (i * 7 + 12) % 45 + 5;
                return (
                  <div key={p.id} className="p-3 rounded-2xl border border-gray-100 bg-white flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getEmoji(p.name)}</span>
                      <div>
                        <p className="text-xs font-black text-gray-900">{p.name}</p>
                        <p className="text-[10px] font-semibold text-gray-400">Rate: ৳{p.sellingPrice.toFixed(2)} / {p.uom}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-black px-3 py-1 rounded-xl ${stockQty > 10 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      Stock: {stockQty} {p.uom}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══ RECENT SALES / REFUND MODAL ══ */}
      {recentSalesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-[520px] rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 text-white flex items-center justify-between" style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
              <div className="flex items-center gap-2.5">
                <History size={22} />
                <div>
                  <h3 className="font-extrabold text-base">Recent Sales &amp; Refunds (F8)</h3>
                  <p className="text-xs opacity-80">View past invoices or trigger reprint</p>
                </div>
              </div>
              <button onClick={() => setRecentSalesOpen(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 max-h-[380px] overflow-y-auto space-y-2.5">
              {salesHistory.map((s, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl border border-gray-200/80 bg-white flex items-center justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-900">{s.invoiceNo}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">{s.paymentMethod}</span>
                    </div>
                    <p className="text-[10px] font-semibold text-gray-400 mt-1">{s.customer || "Walk-in Customer"} • {s.date}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-sm font-black text-emerald-700">৳ {s.grandTotal.toFixed(2)}</p>
                      <p className="text-[10px] font-bold text-gray-400">{s.itemsCount || s.items?.length || 1} Items</p>
                    </div>
                    <button onClick={() => { window.print(); }} className="p-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition">
                      <Printer size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ OFFERS & COUPONS MODAL ══ */}
      {offersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-[440px] rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 text-white flex items-center justify-between" style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
              <div className="flex items-center gap-2.5">
                <Tag size={22} />
                <div>
                  <h3 className="font-extrabold text-base">Active Offers &amp; Promo Codes (F6)</h3>
                  <p className="text-xs opacity-80">Click to apply discount coupon to cart</p>
                </div>
              </div>
              <button onClick={() => setOffersOpen(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { code: "SAVE10", title: "10% Off Grocery Special", desc: "Valid on all grocery items", disc: "10% OFF" },
                { code: "FLAT50", title: "15% Off Family Shopping", desc: "Special weekend promo discount", disc: "15% OFF" },
                { code: "SUPER20", title: "20% Super Store Sale", desc: "Applicable on orders over ৳1,000", disc: "20% OFF" },
              ].map(o => (
                <div key={o.code} className="p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-800 font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">{o.code}</span>
                      <span className="text-xs font-black text-emerald-900">{o.title}</span>
                    </div>
                    <p className="text-[10px] font-semibold text-emerald-700 mt-1">{o.desc}</p>
                  </div>
                  <button onClick={() => { applyCouponCode(o.code); setOffersOpen(false); }} className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition">
                    Apply
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ HELD BILLS DRAWER ══ */}
      {heldCartsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-[450px] rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 text-white flex items-center justify-between" style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
              <div className="flex items-center gap-2.5">
                <PauseCircle size={22} />
                <div>
                  <h3 className="font-extrabold text-base">Held Bills (F7)</h3>
                  <p className="text-xs opacity-80">Recall suspended customer carts</p>
                </div>
              </div>
              <button onClick={() => setHeldCartsOpen(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 max-h-[350px] overflow-y-auto space-y-2.5">
              {heldCarts.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <PauseCircle size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">No held bills found</p>
                </div>
              ) : heldCarts.map(h => (
                <div key={h.id} className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-amber-900">{h.id} • {h.time}</p>
                    <p className="text-[10px] font-bold text-amber-700 mt-0.5">{h.items.length} Items (Total: ৳{h.items.reduce((a, i) => a + i.lineTotal, 0).toFixed(2)})</p>
                  </div>
                  <button onClick={() => recallCart(h)} className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs transition">
                    Recall
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ HARDWARE SETTINGS MODAL ══ */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-[480px] rounded-3xl bg-white shadow-2xl overflow-hidden border border-emerald-100 p-6 space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#dcfce7] text-[#16a34a] flex items-center justify-center shadow-2xs">
                  <Settings size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Hardware Settings</h3>
                </div>
              </div>
              <button onClick={() => setSettingsOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition">
                <X size={18} />
              </button>
            </div>

            {/* List of Hardware Controls */}
            <div className="divide-y divide-emerald-50 bg-white rounded-2xl p-2 border border-emerald-100/80">
              {[
                { key: "receiptPrinter", emoji: "🖨️", label: "Thermal Receipt Printer", desc: hardwareSettings.receiptPrinter ? "Enabled" : "Disabled" },
                { key: "cashDrawer", emoji: "💵", label: "Cash Drawer", desc: hardwareSettings.cashDrawer ? "Enabled" : "Disabled" },
                { key: "barcodeScanner", emoji: "🔍", label: "Barcode Scanner", desc: hardwareSettings.barcodeScanner ? "Enabled" : "Disabled" },
                { key: "scannerBeep", emoji: "🔊", label: "Scanner Audio Beep", desc: hardwareSettings.scannerBeep ? "Audio feedback enabled" : "Audio feedback muted" },
                { key: "cardTerminal", emoji: "💳", label: "Card Terminal", desc: hardwareSettings.cardTerminal ? "Enabled" : "Disabled" },
                { key: "customerDisplay", emoji: "📺", label: "Customer Display", desc: hardwareSettings.customerDisplay ? "Enabled" : "Disabled" },
              ].map(item => {
                const isON = (hardwareSettings as any)[item.key];
                return (
                  <div key={item.key} className="flex items-center justify-between p-2.5 transition hover:bg-white/80 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-lg shadow-2xs">
                        {item.emoji}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900">{item.label}</p>
                        <p className="text-[10px] font-bold text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                    {/* Smooth iOS Toggle Switch */}
                    <button onClick={() => setHardwareSettings(prev => ({ ...prev, [item.key]: !(prev as any)[item.key] }))}
                      className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 ${isON ? "bg-[#16a34a]" : "bg-gray-300"
                        }`}>
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isON ? "translate-x-5" : "translate-x-0"
                        }`} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Info Box */}
            <div className="rounded-2xl bg-[#e0f2fe]/80 border border-[#bae6fd] p-3 flex items-start gap-2.5 text-xs text-[#0369a1]">
              <div className="w-4 h-4 rounded-full bg-[#0284c7] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">i</div>
              <p className="leading-relaxed font-semibold text-[11px]">
                Full hardware activation requires SDK/driver integration. UI is ready — connect ESC/POS, Bluetooth or USB packages in the backend to activate.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button onClick={() => setSettingsOpen(false)} className="px-4 py-2 rounded-xl text-xs font-extrabold text-[#15803d] hover:bg-emerald-50 transition">
                Close
              </button>
              <button onClick={() => { setSettingsOpen(false); setCouponToast("💾 Hardware Settings Saved!"); setTimeout(() => setCouponToast(""), 2500); }}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-md shadow-emerald-600/30 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 bg-gradient-to-r from-[#16a34a] via-[#22c55e] to-[#65a30d] flex items-center gap-1.5">
                <span>💾</span> Save Settings
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══ CASH DRAWER TOAST ══ */}
      {drawerToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-800 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-3 border border-emerald-600">
          <span className="text-2xl">💵</span>
          <div>
            <p className="text-xs font-black">Cash Drawer Opened</p>
            <p className="text-[10px] text-emerald-200">RJ11 pulse signal sent to printer port</p>
          </div>
        </div>
      )}

      {/* ══ COUPON TOAST ══ */}
      {couponToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-3 border border-emerald-500">
          <span className="text-xl">✨</span>
          <p className="text-xs font-black">{couponToast}</p>
        </div>
      )}
    </div>
  );
}
