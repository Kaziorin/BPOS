"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingCart, Scale, Search, Plus, Trash2,
  PauseCircle, Play, CheckCircle2, Printer, ChevronLeft,
  CreditCard, ArrowRight, ShoppingBag, Clock, Users, History,
  Settings, Tag, RotateCcw, ScanLine, Gift, Package, Star,
  Apple, Coffee, Home, Wallet, FileText, X,
  Layers, Grid, AlignLeft, Camera, Info, AlertCircle,
  Utensils, Snowflake, Fish, Sparkles, Heart, ShieldCheck, ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { fetchAllProducts, fetchBatches, applyBatchStock, fetchRegisterContext } from "@/lib/catalog";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { publishCart } from "@/lib/customer-display";

interface TenantInfo {
  branch: { id: string; name: string } | null;
  warehouse: { id: string; name: string } | null;
}
interface RawTenantInfo {
  tenant?: { id: string; slug: string; name: string; businessType: string; currency: string };
  branches?: { id: string; name: string }[];
  warehouses?: { id: string; name: string }[];
}
function pickTenantInfo(raw: RawTenantInfo): TenantInfo {
  return {
    branch: raw.branches?.[0] ? { id: raw.branches[0].id, name: raw.branches[0].name } : null,
    warehouse: raw.warehouses?.[0] ? { id: raw.warehouses[0].id, name: raw.warehouses[0].name } : null,
  };
}

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
  imageUrl?: string;
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

function getCustomerTier(pts: number) {
  if (pts >= 4000) return { name: "VIP", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-100" };
  if (pts >= 1500) return { name: "Gold", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100" };
  if (pts >= 500) return { name: "Silver", color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-100" };
  return { name: "Bronze", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-100" };
}

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
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
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
  const [tenderedInput, setTenderedInput] = useState<string>("");
  const [now, setNow] = useState(new Date());
  const [scaleOpen, setScaleOpen] = useState(false);
  const [scaleProd, setScaleProd] = useState<Product | null>(null);
  const [grossKg, setGrossKg] = useState("1.000");

  // Additional Modal States
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>({ name: "Walk-in Customer", type: "Default Customer", points: 0, phone: "N/A", email: "", address: "" });
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [newCustType, setNewCustType] = useState("Regular Customer");
  const [newCustPoints, setNewCustPoints] = useState("100");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [priceCheckOpen, setPriceCheckOpen] = useState(false);
  const [priceCheckQuery, setPriceCheckQuery] = useState("");
  const [recentSalesOpen, setRecentSalesOpen] = useState(false);
  const [salesSearchQuery, setSalesSearchQuery] = useState("");
  const [stockCheckOpen, setStockCheckOpen] = useState(false);
  const [offersOpen, setOffersOpen] = useState(false);
  const [heldCartsOpen, setHeldCartsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loyaltyModalOpen, setLoyaltyModalOpen] = useState(false);
  const [liveInvoiceModalOpen, setLiveInvoiceModalOpen] = useState(false);
  const [isLoyaltyApplied, setIsLoyaltyApplied] = useState(false);
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

  const [salesHistory, setSalesHistory] = useState<any[]>([]);

  const scanRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const couponInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);

  const loadTenantInfo = useCallback(async () => {
    try {
      const ctx = await fetchRegisterContext();
      setTenantInfo(ctx as any);
    } catch {
      setTenantInfo(null);
    }
  }, []);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  const loadProducts = useCallback(async () => {
    try {
      // Use the standard products list to get category info
      const res: any = await api.get("/products", { params: { limit: 500 } });
      const rawProducts = res?.data ?? res ?? [];

      // Also fetch batches for real stock
      const batches = await fetchBatches();
      const stockMap = new Map<string, number>();
      batches.forEach(b => {
        stockMap.set(b.product.id, (stockMap.get(b.product.id) ?? 0) + Number(b.qty || 0));
      });

      const formatted: Product[] = (Array.isArray(rawProducts) ? rawProducts : []).map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode || undefined,
        sellingPrice: Number(p.sellingPrice || 0),
        uom: p.unit?.name || p.uom || "pcs",
        category: p.category ? { name: p.category.name } : { name: "Grocery" },
        stock: stockMap.get(p.id) ?? 0,
        imageUrl: p.imageUrl || p.images?.[0]?.url || undefined,
      }));
      setProducts(formatted);
    } catch (err) {
      console.error("Load Products Error:", err);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const res: any = await api.get("/customers");
      const d = res?.data?.data ?? res?.data ?? res ?? [];
      if (Array.isArray(d)) {
        const formatted = d.map((c: any) => ({
          id: c.id,
          name: c.name || "Unknown Customer",
          phone: c.phone || "N/A",
          email: c.email || "",
          address: c.address || "",
          type: c.type || c.customerGroup?.name || "Regular Customer",
          points: c.loyaltyPoints || 0,
        }));
        setCustomerList(formatted);
      }
    } catch { }
  }, []);

  const loadSalesHistory = useCallback(async () => {
    try {
      const res: any = await api.get("/pos/sales", { params: { limit: 50 } });
      const data = res?.data ?? res ?? [];
      if (Array.isArray(data)) {
        const formatted = data.map((s: any) => ({
          id: s.id,
          invoiceNo: s.invoiceNo,
          grandTotal: Number(s.grandTotal ?? s.totalAmount ?? s.total ?? 0),
          customer: s.customer?.name || s.customerName || "Walk-in Customer",
          date: new Date(s.createdAt).toLocaleString(),
          paymentMethod: s.paymentMethod || "CASH",
          status: s.status
        }));
        setSalesHistory(formatted);
      }
    } catch { }
  }, []);

  useEffect(() => { loadTenantInfo(); loadProducts(); loadCustomers(); loadSalesHistory(); scanRef.current?.focus(); }, [loadTenantInfo, loadProducts, loadCustomers, loadSalesHistory]);

  const handleSaveNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const createdCust = {
      name: newCustName.trim(),
      phone: newCustPhone.trim() || "N/A",
      email: newCustEmail.trim(),
      address: newCustAddress.trim(),
      type: "Regular Customer",
      points: 0,
    };
    try {
      await api.post("/customers", {
        name: createdCust.name,
        phone: createdCust.phone,
        email: createdCust.email,
        address: createdCust.address,
        status: "ACTIVE",
      });
    } catch { }

    setCustomerList(prev => [createdCust, ...prev]);
    setSelectedCustomer(createdCust);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustEmail("");
    setNewCustAddress("");
    setNewCustPoints("100");
    setIsAddingCustomer(false);
    setCustomerModalOpen(false);
    setCouponToast(`New customer '${createdCust.name}' created & selected!`);
    setTimeout(() => setCouponToast(""), 3000);
  };

  const handleLoyaltyClick = () => {
    const pts = selectedCustomer.points || 0;
    
    // Toggle off if already applied
    if (isLoyaltyApplied) {
      setIsLoyaltyApplied(false);
      setDiscountPct("0.00");
      setCouponToast("Loyalty Cashback removed from cart.");
      setTimeout(() => setCouponToast(""), 3000);
      return;
    }

    // Minimum 500 points requirement check
    if (pts < 500) {
      const needed = 500 - pts;
      setCouponToast(`⚠️ Cashback alert: Minimum 500 points required! You need ${needed} more points.`);
      setTimeout(() => setCouponToast(""), 3500);
      return;
    }

    // Toggle on (Apply cashback)
    const cbPct = pts >= 4000 ? 10 : pts >= 1500 ? 7.5 : 5;
    setIsLoyaltyApplied(true);
    setDiscountPct(cbPct.toFixed(2));
    setCouponToast(`${cbPct}% Loyalty Cashback Applied to Cart! Click again to remove.`);
    setTimeout(() => setCouponToast(""), 3500);
  };

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

  const playSuccessChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      const o1 = ctx.createOscillator(), g1 = ctx.createGain();
      o1.type = "sine"; o1.frequency.setValueAtTime(800, ctx.currentTime);
      g1.gain.setValueAtTime(0.1, ctx.currentTime);
      g1.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.12);
      o1.connect(g1); g1.connect(ctx.destination);
      o1.start(); o1.stop(ctx.currentTime + 0.12);

      setTimeout(() => {
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.type = "sine"; o2.frequency.setValueAtTime(1200, ctx.currentTime);
        g2.gain.setValueAtTime(0.1, ctx.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.2);
        o2.connect(g2); g2.connect(ctx.destination);
        o2.start(); o2.stop(ctx.currentTime + 0.2);
      }, 100);
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
      return [{ id: `${prod.id}-${Date.now()}`, productId: prod.id, name: prod.name, sku: prod.sku, barcode: prod.barcode, unitPrice: up, qty: aq, isWeighed, weightKg: isWeighed ? weightKg : undefined, lineTotal: aq * up, discountPct: 0, uom: prod.uom, image: (prod as any).image || (prod as any).imageUrl }, ...prev];
    });
    setScanInput(""); scanRef.current?.focus();
  };

  const updateQty = (id: string, delta: number) => setCart(prev => prev.map(i => { if (i.id !== id) return i; const nq = Math.max(i.isWeighed ? 0.05 : 1, Number((i.qty + delta).toFixed(3))); return { ...i, qty: nq, lineTotal: nq * i.unitPrice }; }).filter(i => i.qty > 0));
  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => { setCart([]); setDiscountPct("0.00"); setCouponCode(""); setSalesNote(""); setTenderedInput(""); setNumBuf(""); setNumTarget(null); };

  const holdCart = () => { if (!cart.length) return; setHeldCarts(prev => [...prev, { id: `HOLD-${Date.now().toString().slice(-4)}`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), items: cart }]); clearCart(); setCouponToast("📌 Bill Held Successfully"); setTimeout(() => setCouponToast(""), 2500); };
  const recallCart = (h: { id: string; items: CartItem[] }) => { setCart(h.items); setHeldCarts(prev => prev.filter(x => x.id !== h.id)); setHeldCartsOpen(false); };
  const openScale = (prod: Product) => { setScaleProd(prod); setGrossKg("1.000"); setScaleOpen(true); };
  const confirmScale = () => { if (!scaleProd) return; const net = Math.max(0.001, parseFloat(grossKg) || 0); addToCart(scaleProd, net, true, net); setScaleOpen(false); setScaleProd(null); };

  const handleScanKey = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key !== "Enter") return; e.preventDefault(); const code = scanInput.trim().toLowerCase(); if (!code) return; const found = products.find(p => (p.barcode?.toLowerCase() === code) || (p.sku?.toLowerCase() === code) || p.name.toLowerCase() === code); if (found) { const isKg = found.uom?.toLowerCase().includes("kg") || found.uom?.toLowerCase().includes("gm"); if (isKg) openScale(found); else addToCart(found); } else alert(`Barcode "${scanInput}" not found.`); setScanInput(""); };

  const subTotal = cart.reduce((a, i) => a + i.lineTotal, 0);
  const discAmt = subTotal * (parseFloat(discountPct) / 100 || 0);
  const totalItems = cart.length;
  const totalQty = cart.reduce((a, i) => a + i.qty, 0);
  const grandTotal = Math.max(0, subTotal - discAmt);
  const paidAmount = parseFloat(tenderedInput) > 0 ? parseFloat(tenderedInput) : grandTotal;
  const changeDue = Math.max(0, paidAmount - grandTotal);
  const remainingDue = Math.max(0, grandTotal - paidAmount);

  useEffect(() => {
    publishCart({
      updatedAt: Date.now(),
      lines: cart.map(i => ({
        name: i.name,
        qty: i.qty,
        unitPrice: i.unitPrice,
        discountAmount: i.discountPct ? (i.unitPrice * i.qty * i.discountPct / 100) : 0,
        uom: i.uom || "Pcs",
        image: (i as any).image,
      })),
      subtotal: subTotal,
      discountTotal: discAmt,
      taxTotal: 0,
      total: grandTotal,
      status: cart.length > 0 ? "ACTIVE" : "IDLE",
      customerName: selectedCustomer?.name !== "Walk-in Customer" ? selectedCustomer?.name : undefined,
      customerPoints: selectedCustomer?.points,
      customerTier: getCustomerTier(selectedCustomer?.points || 0).name,
      laneNo: "Lane 01",
    });
  }, [cart, subTotal, discAmt, grandTotal, selectedCustomer]);

  const numPress = (key: string) => {
    if (key === "⌫") {
      setNumBuf(p => {
        const next = p.slice(0, -1);
        if (!numTarget) setTenderedInput(next);
        return next;
      });
      return;
    }
    if (key === "=") {
      if (numTarget) {
        const v = parseFloat(numBuf);
        if (!isNaN(v) && v > 0) setCart(prev => prev.map(i => i.id === numTarget ? { ...i, qty: v, lineTotal: v * i.unitPrice } : i));
        setNumTarget(null);
        setNumBuf("");
      } else {
        handleCheckout();
      }
      return;
    }
    if (key === "C") {
      setNumBuf("");
      setNumTarget(null);
      setTenderedInput("");
      return;
    }
    setNumBuf(p => {
      const next = p + key;
      if (!numTarget) setTenderedInput(next);
      return next;
    });
  };

  const handleCheckout = async () => {
    if (!cart.length) return;

    // Explicitly check for configuration before proceeding
    const bId = tenantInfo?.branch?.id;
    const wId = tenantInfo?.warehouse?.id;

    if (!bId || !wId) {
      setCouponToast("⚠️ System Setup Error: Active Branch or Warehouse not detected. Please verify your profile settings.");
      setTimeout(() => setCouponToast(""), 5000);
      return;
    }

    setSubmitting(true);
    playSuccessChime();

    const finalPaid = paidAmount;
    const finalChange = changeDue;

    try {
      const payload = {
        branchId: bId,
        warehouseId: wId,
        customerId: selectedCustomer?.id || null,
        items: cart.map(i => ({
          productId: i.productId,
          variantId: null,
          name: i.name,
          qty: i.qty,
          unitPrice: i.unitPrice,
          discountAmount: i.discountPct ? (i.unitPrice * i.qty * i.discountPct / 100) : 0,
          lineTotal: i.lineTotal
        })),
        payments: [{
          method: payMethod.toUpperCase().includes("CASH") ? "CASH" :
                  payMethod.toUpperCase().includes("CARD") ? "CARD" :
                  payMethod.toUpperCase().includes("WALLET") ? "WALLET" : "UPI",
          amount: grandTotal
        }],
        subTotal,
        grandTotal,
        discountTotal: discAmt,
        taxTotal: 0,
        serviceCharge: 0,
        note: salesNote || `Grocery POS · ${payMethod}`
      };

      const res: any = await api.post("/api/v1/pos/confirm", payload);

      // The backend returns the full sale result
      const saleResult = res?.data ?? res ?? {};
      const invNo = saleResult.invoiceNo || `GRO-${Date.now().toString().slice(-6)}`;

      const completedRecord = {
        invoiceNo: invNo,
        items: [...cart],
        grandTotal,
        subTotal,
        discAmt,
        paymentMethod: payMethod,
        customer: selectedCustomer.name,
        date: new Date().toLocaleString(),
        paidAmount: finalPaid,
        changeReturn: finalChange
      };

      setCompletedInv(completedRecord);
      setSalesHistory(prev => [completedRecord, ...prev]);

      publishCart({
        updatedAt: Date.now(),
        invoiceNo: invNo,
        lines: cart.map(i => ({
          name: i.name,
          qty: i.qty,
          unitPrice: i.unitPrice,
          discountAmount: i.discountPct ? (i.unitPrice * i.qty * i.discountPct / 100) : 0,
        })),
        subtotal: subTotal,
        discountTotal: discAmt,
        taxTotal: 0,
        total: grandTotal,
        paidTotal: finalPaid,
        changeTotal: finalChange,
        paymentMethod: payMethod,
        status: "PAID",
        customerName: selectedCustomer?.name !== "Walk-in Customer" ? selectedCustomer?.name : undefined,
        customerPoints: selectedCustomer?.points,
        customerTier: getCustomerTier(selectedCustomer?.points || 0).name,
        pointsEarned: Math.floor(grandTotal / 100),
      });

      // Reset POS state
      clearCart();
      setSelectedCustomer({ name: "Walk-in Customer", type: "Default Customer", points: 0, phone: "N/A", email: "", address: "" });

      // VITAL: Reload system products to show updated stock levels immediately
      await loadProducts();

      setCouponToast("🎉 Sale processed and synced with system successfully!");
      setTimeout(() => setCouponToast(""), 3500);

    } catch (err: any) {
      console.error("POS Sync Error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Unknown synchronization error.";
      setCouponToast(`⚠️ Sync Failed: ${errorMsg}`);
      setTimeout(() => setCouponToast(""), 6000);
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
      else if (e.key === "F10") { e.preventDefault(); setIsAddingCustomer(true); setCustomerModalOpen(true); }
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
    <>
    <div className="relative flex flex-col h-screen w-screen bg-white select-none overflow-hidden" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>

      {/* ══ ORGANIC CURVED WAVE BACKDROP — EXACT RGBA(187, 238, 100) GRADIENT ══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* ── TOP HEADER ORGANIC CURVED WAVES (rgba(187, 238, 100) Gradient Theme) ── */}
        {/* Top Upper Soft Mint-Lime Wave */}
        <svg className="absolute top-0 left-0 w-full h-[140px] opacity-100" viewBox="0 0 1200 140" fill="none" preserveAspectRatio="none">
          <path d="M 0 0 L 1200 0 L 1200 65 C 920 135, 580 30, 280 115 C 140 135, 40 70, 0 85 Z" fill="url(#top-mint-wave-rgba)" />
          <defs>
            <linearGradient id="top-mint-wave-rgba" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(187, 238, 100, 0.95)" />
              <stop offset="50%" stopColor="rgba(187, 238, 100, 0.75)" />
              <stop offset="85%" stopColor="rgba(220, 252, 231, 0.5)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Top Main Vivid Front Wave — Clear Organic Curved Line Sweeping Across Header */}
        <svg className="absolute top-0 left-0 w-[78%] h-[115px] opacity-100 drop-shadow-xs" viewBox="0 0 1000 115" fill="none" preserveAspectRatio="none">
          <path d="M 0 0 L 1000 0 L 1000 35 C 760 110, 480 20, 220 95 C 100 110, 30 45, 0 60 Z" fill="url(#top-lime-vivid-rgba)" />
          <defs>
            <linearGradient id="top-lime-vivid-rgba" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(187, 238, 100, 1)" />
              <stop offset="40%" stopColor="rgba(163, 230, 53, 0.85)" />
              <stop offset="75%" stopColor="rgba(187, 238, 100, 0.5)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Top-Left Deep Yellow-Green Glow Wave */}
        <svg className="absolute top-0 left-0 w-[52%] h-[85px] opacity-95" viewBox="0 0 700 85" fill="none" preserveAspectRatio="none">
          <path d="M 0 0 L 700 0 L 700 25 C 500 80, 300 15, 120 70 C 50 80, 10 30, 0 40 Z" fill="url(#top-lime-glow-rgba)" />
          <defs>
            <linearGradient id="top-lime-glow-rgba" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(163, 230, 53, 0.95)" />
              <stop offset="45%" stopColor="rgba(187, 238, 100, 0.7)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
        </svg>

        {/* ── BOTTOM FOOTER ORGANIC CURVED WAVES (rgba(187, 238, 100) Theme) ── */}
        {/* Upper Soft Mint Wave */}
        <svg className="absolute bottom-0 left-0 w-[70%] h-[280px] opacity-95" viewBox="0 0 1000 280" fill="none" preserveAspectRatio="none">
          <path d="M 0 110 C 180 200, 380 20, 680 160 C 830 220, 940 70, 1000 110 L 1000 280 L 0 280 Z" fill="url(#mint-wave-top)" />
          <defs>
            <linearGradient id="mint-wave-top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(238, 252, 227, 0.95)" />
              <stop offset="45%" stopColor="rgba(187, 238, 100, 0.6)" />
              <stop offset="85%" stopColor="rgba(255, 255, 255, 0.1)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Main Vivid Lime-Green Front Wave */}
        <svg className="absolute bottom-0 left-0 w-[62%] h-[210px] opacity-100" viewBox="0 0 1000 210" fill="none" preserveAspectRatio="none">
          <path d="M 0 45 C 160 165, 360 15, 630 140 C 790 195, 910 85, 1000 125 L 1000 210 L 0 210 Z" fill="url(#lime-wave-vivid)" />
          <defs>
            <linearGradient id="lime-wave-vivid" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(187, 238, 100, 1)" />
              <stop offset="30%" stopColor="rgba(190, 242, 100, 0.9)" />
              <stop offset="65%" stopColor="rgba(220, 252, 231, 0.6)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Bottom Left Deep Yellow-Green Glow Wave */}
        <svg className="absolute -bottom-2 -left-4 w-[48%] h-[150px] opacity-95" viewBox="0 0 800 150" fill="none" preserveAspectRatio="none">
          <path d="M 0 25 C 130 125, 290 5, 520 105 C 670 155, 760 65, 800 95 L 800 150 L 0 150 Z" fill="url(#lime-wave-glow)" />
          <defs>
            <linearGradient id="lime-wave-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(163, 230, 53, 0.95)" />
              <stop offset="40%" stopColor="rgba(187, 238, 100, 0.6)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ══ HEADER — Glassmorphic Elegant rgba(187, 238, 100) Curved Theme Header ══ */}
      <header className="relative z-20 flex-none flex items-center justify-between gap-4 px-6 py-2.5 bg-white/70 backdrop-blur-xs border-b border-emerald-300/60 shadow-2xs relative overflow-hidden" style={{ minHeight: 64 }}>

        {/* Brand Logo: BPOS */}
        <div className="relative z-10 flex items-center gap-3">
          <Link href="/grocery" className="flex items-center text-slate-700 hover:text-slate-900 transition mr-1 bg-white/90 hover:bg-white p-1.5 rounded-xl border border-emerald-300/80 shadow-2xs">
            <ChevronLeft size={18} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-xl bg-white border border-emerald-400 text-emerald-700 flex items-center justify-center shadow-xs">
              <ShoppingCart size={22} strokeWidth={2.2} />
              <div className="absolute -top-1 -right-1 text-xs">🌿</div>
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">BPOS</h1>
                <span className="bg-emerald-700 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider shadow-2xs">GROCERY</span>
              </div>
              <p className="text-[9.5px] font-bold tracking-wider text-emerald-800 uppercase">POS SYSTEM</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative z-10 flex-1 max-w-xl">
          <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-full border border-emerald-400 shadow-sm px-4 py-1.5 text-slate-800 transition focus-within:ring-2 focus-within:ring-emerald-500">
            <Search size={17} className="text-slate-400 shrink-0 mr-2.5" />
            <input ref={scanRef} type="text" value={scanInput} onChange={e => { setScanInput(e.target.value); setSearchFilter(e.target.value); }} onKeyDown={handleScanKey}
              placeholder="Search product by name, barcode or scan..."
              className="w-full bg-transparent text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none" />
            <ScanLine size={17} className="text-emerald-700 shrink-0 ml-2" />
          </div>
        </div>

        {/* Header Info Cards */}
        <div className="relative z-10 flex items-center gap-2">
          {[
            { icon: <Users size={14} strokeWidth={2.5} />, bg: "bg-emerald-100 text-emerald-900 border-emerald-300", label: selectedCustomer.name, sub: getCustomerTier(selectedCustomer.points).name + " Member", onClick: () => setCustomerModalOpen(true) },
            { icon: <span className="text-xs font-bold">★</span>, bg: "bg-emerald-700 text-white shadow-xs animate-pulse", label: "Loyalty Points", sub: `${selectedCustomer.points} Pts`, onClick: handleLoyaltyClick },
            { icon: <FileText size={14} strokeWidth={2.2} />, bg: "bg-emerald-100 text-emerald-900 border-emerald-300", label: "Invoice", sub: "INV-250520-0012", onClick: () => setLiveInvoiceModalOpen(true) },
            { icon: <Clock size={14} strokeWidth={2.2} />, bg: "bg-emerald-100 text-emerald-900 border-emerald-300", label: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), sub: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
          ].map((c, i) => (
            <div key={i} onClick={c.onClick} className="flex items-center gap-2 bg-white/90 hover:bg-white rounded-xl px-3 py-1.5 border border-emerald-300/80 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${c.bg}`}>{c.icon}</div>
              <div className="leading-tight">
                <p className="text-[11px] font-extrabold text-slate-800 whitespace-nowrap">{c.label}</p>
                <p className="text-[9px] font-bold text-slate-500 whitespace-nowrap">{c.sub}</p>
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
                const cartItem = cart.find(c => c.productId === p.id);
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

                    {/* Pure White Square Image / Emoji Showcase */}
                    <div className="w-full h-20 sm:h-22 aspect-square flex items-center justify-center rounded-xl text-[38px] leading-none mb-2 select-none group-hover:scale-108 transition-all duration-200 border border-gray-100 bg-white relative overflow-hidden shrink-0 shadow-2xs">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="relative z-10 drop-shadow-xs select-none">{emoji}</span>
                      )}
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
                { label: "Add Customer", key: "F10", icon: <Users size={16} />, onClick: () => { setIsAddingCustomer(true); setCustomerModalOpen(true); } },
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
            <div className="bg-gradient-to-b from-white via-emerald-50/30 to-emerald-100/40 rounded-xl px-3 py-2 border-t border-x border-emerald-200/90 border-b-[2.5px] border-b-emerald-300 shadow-2xs flex flex-col justify-between">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center text-slate-500 font-semibold">
                  <span>Subtotal</span><span className="text-slate-800 font-bold">৳ {subTotal.toFixed(2)}</span>
                </div>
                {discAmt > 0 && (
                  <div className="flex justify-between items-center text-slate-500 font-semibold">
                    <span>Discount</span><span className="text-emerald-700 font-bold">- ৳ {discAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-1 border-t border-dashed border-emerald-200 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-900 uppercase">Net Total</span>
                  <span className="text-lg font-extrabold text-emerald-600">৳ {grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-0.5">
                  <span className="text-slate-600 font-semibold">Cash Given:</span>
                  <span className="text-slate-900 font-mono font-bold">৳ {paidAmount.toFixed(2)}</span>
                </div>
              </div>
              {changeDue > 0 ? (
                <div className="mt-1 bg-emerald-600 text-white py-1 px-2.5 rounded-lg font-extrabold text-xs shadow-xs animate-in zoom-in-95 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide opacity-90">Change:</span>
                  <span className="font-mono text-sm font-black">৳ {changeDue.toFixed(2)}</span>
                </div>
              ) : remainingDue > 0 ? (
                <div className="mt-1 bg-amber-500 text-white py-1 px-2.5 rounded-lg font-extrabold text-xs shadow-xs flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide opacity-90">Due:</span>
                  <span className="font-mono text-sm font-black">৳ {remainingDue.toFixed(2)}</span>
                </div>
              ) : (
                <div className="mt-1 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-center py-0.5 px-2 rounded-lg font-bold text-[11px]">
                  Change: ৳ 0.00
                </div>
              )}
            </div>
          </div>

          {/* ── 3. BOTTOM — Numpad with Live Digital Readout Display | Payment + Pay CTA ── shrink-0 */}
          <div className="shrink-0 bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden" style={{ height: 235 }}>
            <div className="grid grid-cols-12 divide-x divide-gray-100 h-full">

              {/* LEFT: Function Keys + Numpad (6 columns) */}
              <div className="col-span-6 flex flex-col p-2.5 overflow-hidden h-full">
                
                {/* Grid for Function Keys + Numpad */}
                <div className="flex-1 flex gap-1.5 overflow-hidden">
                  <div className="flex flex-col gap-1 shrink-0 w-[110px]">
                    {[
                      { label: "Price Check", key: "F3", Icon: Search, onClick: () => setPriceCheckOpen(true) },
                      { label: "Barcode Scan", key: "F4", Icon: ScanLine, onClick: () => scanRef.current?.focus() },
                      { label: "Recent Sales", key: "F5", Icon: History, onClick: () => setRecentSalesOpen(true) },
                      { label: "Returns", key: "F6", Icon: RotateCcw, onClick: () => setRecentSalesOpen(true) },
                    ].map(({ label, key, Icon, onClick }) => (
                      <button key={key} onClick={onClick} className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-xs active:scale-95 transition-all duration-150 flex-1 overflow-hidden text-left shadow-2xs group cursor-pointer">
                        <Icon size={14} className="text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-slate-800 truncate leading-tight group-hover:text-emerald-700">{label}</p>
                          <span className="text-[8px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200 px-1 py-0.1 rounded inline-block mt-0.5">{key}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-1 min-w-0">
                    {NUM_KEYS.map(k => (
                      <button key={k} onClick={() => numPress(k)}
                        className={`rounded-xl font-extrabold text-sm flex items-center justify-center transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0.5 active:scale-90 cursor-pointer ${
                          k === "=" ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm font-bold text-base"
                          : k === "⌫" ? "bg-rose-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold"
                          : "bg-gray-50 border border-gray-200 text-slate-800 hover:bg-white hover:border-gray-300 shadow-2xs"
                        }`}>
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* RIGHT: Payment Pills (Vertical Column) + Pay CTA & Save & Print (6 columns) */}
              <div className="col-span-6 flex gap-2 p-2.5 overflow-hidden h-full">

                {/* 1. Left: 5 Vertical Payment Method Pills */}
                <div className="flex flex-col gap-1 shrink-0 w-[125px] h-full">
                  {PAY_CFG.map(pm => {
                    const on = payMethod === pm.id;
                    return (
                      <button key={pm.id} onClick={() => setPayMethod(pm.id as any)}
                        className={`flex-1 flex items-center gap-2 px-2.5 rounded-xl border text-xs font-bold transition-all duration-150 transform hover:-translate-y-0.5 active:scale-95 text-left min-w-0 cursor-pointer ${
                          on 
                            ? "bg-emerald-600 text-white border-emerald-700 shadow-sm font-extrabold" 
                            : "bg-white border-gray-200 text-slate-700 hover:border-gray-300"
                        }`}>
                        <pm.Icon size={14} className={`shrink-0 ${on ? "text-white" : "text-slate-500"}`} />
                        <span className="truncate leading-none text-[11px]">{pm.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 2. Right: Hero Pay CTA Box (Top) + Save & Print Bill (Bottom) */}
                <div className="flex-1 flex flex-col gap-2 min-w-0 h-full">

                  {/* Top: Hero Pay CTA Card */}
                  <button onClick={handleCheckout} disabled={!cart.length || submitting}
                    className="flex-1 w-full rounded-2xl text-white flex items-center justify-between px-3.5 py-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 bg-emerald-600 hover:bg-emerald-500 border border-emerald-700 relative overflow-hidden group min-w-0 cursor-pointer">
                    <div className="text-left flex flex-col justify-center relative z-10 min-w-0 flex-1 mr-1">
                      <p className="text-xs font-bold text-white/90 leading-none">Pay</p>
                      {(() => {
                        const str = grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        const len = str.length;
                        const sizeClass = len > 12 ? 'text-sm' : len > 9 ? 'text-base' : 'text-xl sm:text-2xl';
                        return (
                          <p className={`${sizeClass} font-extrabold text-white leading-tight mt-0.5 whitespace-nowrap`}>
                            ৳ {str}
                          </p>
                        );
                      })()}
                    </div>
                    <div className="relative z-10 w-9 h-9 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-all">
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowRight size={19} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
                      )}
                    </div>
                  </button>

                  {/* Bottom: Save & Print Bill */}
                  <button onClick={() => window.print()} disabled={!cart.length}
                    className="w-full py-2 rounded-xl border border-gray-200 text-xs font-bold flex items-center justify-center gap-2 transition-all duration-150 transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 bg-white hover:bg-gray-50 text-slate-800 shadow-2xs shrink-0 cursor-pointer group">
                    <Printer size={14} className="shrink-0 text-slate-600 group-hover:scale-110 transition-transform" />
                    <span className="truncate">Save &amp; Print Bill</span>
                  </button>

                </div>

              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ══ CUSTOMER SELECTION & ADD CUSTOMER MODAL (F10) ══ */}
      <CustomModal
        open={customerModalOpen}
        onClose={() => { setCustomerModalOpen(false); setIsAddingCustomer(false); }}
        title={isAddingCustomer ? "Add New Customer" : "Select Customer (F10)"}
        size="lg"
      >
        {/* Sub-header Navigation Tabs */}
        <div className="flex items-center border-b border-gray-100 bg-gray-50 px-4 py-2 gap-2 mb-4 -mx-6 -mt-5">
          <button onClick={() => setIsAddingCustomer(false)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${!isAddingCustomer ? "bg-white text-emerald-700 shadow-2xs border border-gray-200" : "text-gray-500 hover:text-gray-800"}`}>
            Select Customer ({customerList.length})
          </button>
          <button onClick={() => setIsAddingCustomer(true)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${isAddingCustomer ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"}`}>
            ＋ Add New Customer
          </button>
        </div>

        <div>
          {isAddingCustomer ? (
            /* ── ADD NEW CUSTOMER FORM ── */
            <form onSubmit={handleSaveNewCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Full Name"
                  required
                  autoFocus
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  placeholder="John Doe"
                />
                <CustomInput
                  label="Phone Number"
                  type="tel"
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  placeholder="01711XXXXXX"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Email Address"
                  type="email"
                  value={newCustEmail}
                  onChange={e => setNewCustEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
                <div>
                  <label className="mb-1.5 block text-[15px] font-semibold text-gray-600 capitalize">Customer Group</label>
                  <input type="text" readOnly value="Regular Customer"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 outline-none" />
                </div>
              </div>

              <CustomInput
                label="Residential Address"
                value={newCustAddress}
                onChange={e => setNewCustAddress(e.target.value)}
                placeholder="House #, Road #, Area, City"
              />

              <div className="pt-2 flex items-center gap-2.5">
                <CustomButton
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setIsAddingCustomer(false)}
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  type="submit"
                  themeColor="emerald"
                  fullWidth
                  leftIcon={<Plus size={15} strokeWidth={2.5} />}
                >
                  Save & Select
                </CustomButton>
              </div>
            </form>
          ) : (
            /* ── SELECT CUSTOMER LIST ── */
            <div className="space-y-4">
              <CustomInput
                autoFocus
                placeholder="Search by name or phone number..."
                value={customerSearchQuery}
                onChange={e => setCustomerSearchQuery(e.target.value)}
                leftIcon={<Search size={16} />}
              />

              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                {customerList
                  .filter(c =>
                    !customerSearchQuery ||
                    c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                    c.phone.includes(customerSearchQuery)
                  )
                  .map((c, idx) => {
                    const tier = getCustomerTier(c.points);
                    return (
                      <button key={idx} onClick={() => { setSelectedCustomer(c); setCustomerModalOpen(false); setCouponToast(`Customer set to ${c.name}`); setTimeout(() => setCouponToast(""), 2500); }}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${selectedCustomer.name === c.name ? "border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20" : "border-gray-200/80 bg-white hover:bg-gray-50"
                          }`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900">{c.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] font-semibold text-gray-400">{c.phone}</p>
                              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border uppercase tracking-tighter ${tier.color} ${tier.bg} ${tier.border}`}>
                                {tier.name}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-xl">
                          ★ {c.points} Pts
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </CustomModal>



      {/* ══ CURRENT CART LIVE INVOICE PREVIEW MODAL ══ */}
      <CustomModal
        open={liveInvoiceModalOpen}
        onClose={() => setLiveInvoiceModalOpen(false)}
        title="Current Cart Invoice"
        size="lg"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-inner">
              <FileText size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-emerald-900 leading-tight">Invoice Preview</h3>
              <p className="text-[10px] text-emerald-600 mt-0.5 uppercase font-bold tracking-wider">Live Draft • INV-250520-0012</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm font-mono text-xs text-slate-800 space-y-3">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingCart size={40} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-extrabold text-slate-700">Cart is currently empty</p>
                <p className="text-xs text-slate-400 mt-1 uppercase">Add items to the cart to preview active cart invoice.</p>
              </div>
            ) : (
              <>
                {/* Shop Header */}
                <div className="text-center border-b border-dashed border-gray-300 pb-3 space-y-1">
                  <p className="text-base font-extrabold text-slate-950 tracking-tight uppercase">Blue Oceans Superstore</p>
                  <p className="text-[11px] text-slate-500">Dhaka Main Outlet • POS Terminal-01</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Draft Cart Invoice</p>
                </div>

                {/* Metadata */}
                <div className="space-y-1 text-[11px] text-slate-600 border-b border-dashed border-gray-300 pb-2">
                  <div className="flex justify-between">
                    <span>Invoice No:</span>
                    <span className="font-bold text-slate-900">INV-250520-0012</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Time:</span>
                    <span>{now.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-bold text-slate-900">{selectedCustomer.name}</span>
                  </div>
                </div>

                {/* Itemized List */}
                <div className="space-y-1.5 text-xs py-1 border-b border-dashed border-gray-300">
                  <div className="flex justify-between font-bold text-[10px] uppercase text-slate-400 pb-1">
                    <span>Item</span>
                    <span>Qty x Price</span>
                    <span>Total</span>
                  </div>
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] py-0.5 border-b border-gray-50 last:border-0">
                      <div className="min-w-0 max-w-[170px]">
                        <p className="font-bold text-slate-800 truncate">{item.name}</p>
                      </div>
                      <div className="text-slate-500 font-mono text-[10px]">
                        {item.qty} {item.uom || "pcs"} x ৳{item.unitPrice.toFixed(2)}
                      </div>
                      <div className="font-bold text-slate-900 font-mono">
                        ৳{item.lineTotal.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="space-y-1 text-xs pt-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>৳{subTotal.toFixed(2)}</span>
                  </div>
                  {discAmt > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount Saved:</span>
                      <span>- ৳{discAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-sm text-slate-900 border-t border-b border-gray-200 py-1 my-1">
                    <span>Net Cart Total:</span>
                    <span className="text-emerald-700 font-black">৳{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Barcode & Footer */}
                <div className="text-center border-t border-dashed border-gray-300 pt-3 space-y-1">
                  <p className="text-[10px] text-slate-400">Cart Preview Invoice</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Blue Oceans POS</p>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <CustomButton
              fullWidth
              variant="outline"
              disabled={!cart.length}
              onClick={() => window.print()}
              leftIcon={<Printer size={16} />}
            >
              Print Draft
            </CustomButton>
            <CustomButton
              fullWidth
              themeColor="emerald"
              onClick={() => setLiveInvoiceModalOpen(false)}
            >
              Close Preview
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ══ PRICE CHECK MODAL ══ */}
      <CustomModal
        open={priceCheckOpen}
        onClose={() => setPriceCheckOpen(false)}
        title="Price & Stock Check (F3)"
        size="lg"
      >
        <div className="space-y-4">
          <CustomInput
            autoFocus
            leftIcon={<Search size={18} />}
            value={priceCheckQuery}
            onChange={e => setPriceCheckQuery(e.target.value)}
            placeholder="Search product by name or SKU..."
          />
          <div className="max-h-[350px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {products.filter(p => !priceCheckQuery || p.name.toLowerCase().includes(priceCheckQuery.toLowerCase()) || p.sku.toLowerCase().includes(priceCheckQuery.toLowerCase())).slice(0, 8).map(p => (
              <div key={p.id} className="p-3.5 rounded-2xl border border-gray-100 bg-slate-50/50 flex items-center justify-between group hover:bg-white hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{getEmoji(p.name)}</span>
                  <div>
                    <p className="text-xs font-black text-gray-900 leading-tight">{p.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">SKU: {p.sku} • {p.category?.name}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div className="leading-tight">
                    <p className="text-sm font-black text-emerald-700">৳ {p.sellingPrice.toFixed(2)}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Per {p.uom}</p>
                  </div>
                  <CustomButton
                    size="sm"
                    themeColor="emerald"
                    onClick={() => { addToCart(p); setPriceCheckOpen(false); }}
                  >
                    Add
                  </CustomButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CustomModal>

      {/* ══ STOCK CHECK MODAL ══ */}
      <CustomModal
        open={stockCheckOpen}
        onClose={() => setStockCheckOpen(false)}
        title="Inventory Stock Check (F5)"
        size="lg"
      >
        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
          {products.slice(0, 15).map((p) => (
            <div key={p.id} className="p-3.5 rounded-2xl border border-gray-100 bg-white flex items-center justify-between shadow-xs hover:border-emerald-200 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl">
                  {getEmoji(p.name)}
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900 leading-tight">{p.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5">Rate: ৳{p.sellingPrice.toFixed(2)} / {p.uom}</p>
                </div>
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-xl border uppercase tracking-wider ${
                (p.stock ?? 0) > 10
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-amber-50 text-amber-700 border-amber-100"
              }`}>
                Stock: {p.stock ?? 0} {p.uom}
              </span>
            </div>
          ))}
        </div>
      </CustomModal>

      {/* ══ RECENT SALES / REFUND MODAL ══ */}
      <CustomModal
        open={recentSalesOpen}
        onClose={() => setRecentSalesOpen(false)}
        title="Recent Sales & Refunds (F8)"
        size="lg"
      >
        <div className="space-y-4">
          <CustomInput
            autoFocus
            leftIcon={<Search size={18} />}
            value={salesSearchQuery}
            onChange={e => setSalesSearchQuery(e.target.value)}
            placeholder="Search past sales by Invoice No, Customer, Payment..."
          />

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {salesHistory
              .filter(s => {
                if (!salesSearchQuery.trim()) return true;
                const q = salesSearchQuery.toLowerCase().trim();
                return (
                  s.invoiceNo?.toLowerCase().includes(q) ||
                  s.customer?.toLowerCase().includes(q) ||
                  s.paymentMethod?.toLowerCase().includes(q) ||
                  s.date?.toLowerCase().includes(q) ||
                  s.grandTotal?.toString().includes(q)
                );
              })
              .map((s, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-gray-100 bg-white flex items-center justify-between shadow-xs hover:border-emerald-200 transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-slate-900 uppercase font-mono tracking-tighter">#{s.invoiceNo}</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-widest">{s.paymentMethod}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{s.customer} • {s.date}</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div className="leading-tight">
                      <p className="text-sm font-black text-emerald-700">৳ {s.grandTotal.toFixed(2)}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Sale Confirmed</p>
                    </div>
                    <button onClick={() => { window.print(); }} className="p-2.5 rounded-xl border border-gray-100 bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-all active:scale-90">
                      <Printer size={16} />
                    </button>
                  </div>
                </div>
              ))}
            {salesHistory.filter(s => {
              if (!salesSearchQuery.trim()) return true;
              const q = salesSearchQuery.toLowerCase().trim();
              return (
                s.invoiceNo?.toLowerCase().includes(q) ||
                s.customer?.toLowerCase().includes(q) ||
                s.paymentMethod?.toLowerCase().includes(q) ||
                s.date?.toLowerCase().includes(q) ||
                s.grandTotal?.toString().includes(q)
              );
            }).length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <History size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold uppercase tracking-widest">
                  {salesSearchQuery ? `No sales match "${salesSearchQuery}"` : "No recent sales found"}
                </p>
              </div>
            )}
          </div>
        </div>
      </CustomModal>

      {/* ══ OFFERS & COUPONS MODAL ══ */}
      <CustomModal
        open={offersOpen}
        onClose={() => setOffersOpen(false)}
        title="Active Offers & Promo Codes (F6)"
        size="md"
      >
        <div className="space-y-3">
          {[
            { code: "SAVE10", title: "10% Off Grocery Special", desc: "Valid on all grocery items", disc: "10% OFF" },
            { code: "FLAT50", title: "15% Off Family Shopping", desc: "Special weekend promo discount", disc: "15% OFF" },
            { code: "SUPER20", title: "20% Super Store Sale", desc: "Applicable on orders over ৳1,000", disc: "20% OFF" },
          ].map(o => (
            <div key={o.code} className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 flex items-center justify-between group hover:bg-white transition-all">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-emerald-800 font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">{o.code}</span>
                  <span className="text-xs font-black text-slate-900">{o.title}</span>
                </div>
                <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tight">{o.desc}</p>
              </div>
              <CustomButton
                size="sm"
                themeColor="emerald"
                onClick={() => { applyCouponCode(o.code); setOffersOpen(false); }}
              >
                Apply
              </CustomButton>
            </div>
          ))}
        </div>
      </CustomModal>

      {/* ══ HELD BILLS DRAWER ══ */}
      <CustomModal
        open={heldCartsOpen}
        onClose={() => setHeldCartsOpen(false)}
        title="Held Bills (F7)"
        size="md"
      >
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {heldCarts.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <PauseCircle size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">No held bills found</p>
            </div>
          ) : heldCarts.map(h => (
            <div key={h.id} className="p-4 rounded-2xl border border-amber-100 bg-amber-50/30 flex items-center justify-between group hover:bg-white hover:border-amber-300 transition-all">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-amber-900 uppercase font-mono tracking-tighter">#{h.id}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{h.time}</span>
                </div>
                <p className="text-[10px] font-bold text-amber-700 mt-1 uppercase tracking-tight">
                  {h.items.length} Items • Total: ৳{h.items.reduce((a, i) => a + i.lineTotal, 0).toFixed(2)}
                </p>
              </div>
              <CustomButton
                size="sm"
                themeColor="amber"
                onClick={() => recallCart(h)}
              >
                Recall
              </CustomButton>
            </div>
          ))}
        </div>
      </CustomModal>

      {/* ══ HARDWARE SETTINGS MODAL ══ */}
      <CustomModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Hardware Settings"
        size="md"
      >
        <div className="space-y-5">
          <div className="divide-y divide-gray-100 bg-slate-50 rounded-2xl p-2 border border-gray-100">
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
                <div key={item.key} className="flex items-center justify-between p-3.5 transition hover:bg-white rounded-xl group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-xl shadow-xs group-hover:border-emerald-200 transition-colors">
                      {item.emoji}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 leading-tight">{item.label}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  {/* iOS Style Toggle */}
                  <button onClick={() => setHardwareSettings(prev => ({ ...prev, [item.key]: !(prev as any)[item.key] }))}
                    className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 ${isON ? "bg-emerald-500" : "bg-gray-300"}`}>
                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isON ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 italic">i</div>
            <p className="text-[11px] font-bold text-blue-700 leading-relaxed uppercase tracking-tight">
              Full hardware activation requires SDK/driver integration. UI is ready — connect ESC/POS or USB packages to activate.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <CustomButton variant="outline" onClick={() => setSettingsOpen(false)}>
              Close
            </CustomButton>
            <CustomButton themeColor="emerald" onClick={() => { setSettingsOpen(false); setCouponToast("💾 Hardware Settings Saved!"); setTimeout(() => setCouponToast(""), 2500); }}>
              Save Settings
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ══ CASH DRAWER TOAST ══ */}
      {drawerToast && (
        <div className="fixed top-6 right-6 z-[100] max-w-[360px] w-full animate-in slide-in-from-top-4 duration-300">
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] border border-emerald-100 flex p-4 gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-2xl shadow-sm">
              <Wallet size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-0.5">Hardware Event</p>
              <p className="text-xs font-extrabold text-slate-900">Cash Drawer Opened</p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">RJ11 pulse signal sent to port</p>
            </div>
          </div>
        </div>
      )}

      {/* ══ NOTIFICATION / COUPON TOAST ══ */}
      {couponToast && (
        <div className="fixed top-6 right-6 z-[100] max-w-[400px] w-full animate-in slide-in-from-top-4 duration-300">
          <div className="relative group overflow-hidden rounded-3xl bg-white/95 backdrop-blur-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] border border-white/40 flex p-4.5 gap-4 ring-1 ring-black/5">

            {/* Status-based Glow Effect */}
            <div className={`absolute -left-10 -top-10 w-32 h-32 blur-3xl opacity-20 rounded-full ${
              couponToast.includes("⚠️") ? "bg-amber-500" :
              couponToast.includes("Loyalty") ? "bg-indigo-500" :
              "bg-emerald-500"
            }`} />

            {/* Icon Container */}
            <div className={`relative flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transform group-hover:scale-110 transition-transform duration-300 ${
              couponToast.includes("⚠️") ? "bg-amber-100 text-amber-600 border border-amber-200" :
              couponToast.includes("Loyalty") ? "bg-indigo-100 text-indigo-600 border border-indigo-200" :
              "bg-emerald-100 text-emerald-600 border border-emerald-200"
            }`}>
              {couponToast.includes("⚠️") ? <AlertCircle size={24} strokeWidth={2.5} /> :
               couponToast.includes("Loyalty") ? <Gift size={24} strokeWidth={2.5} /> :
               couponToast.includes("🚀") ? <Sparkles size={24} strokeWidth={2.5} /> :
               couponToast.includes("📌") ? <PauseCircle size={24} strokeWidth={2.5} /> :
               couponToast.includes("💾") ? <Settings size={24} strokeWidth={2.5} /> :
               <CheckCircle2 size={24} strokeWidth={2.5} />}
            </div>

            {/* Text Content */}
            <div className="relative flex-1 min-w-0 py-0.5">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${
                  couponToast.includes("⚠️") ? "text-amber-700" :
                  couponToast.includes("Loyalty") ? "text-indigo-700" :
                  couponToast.includes("🚀") ? "text-blue-700" :
                  "text-emerald-700"
                }`}>
                  {couponToast.includes("⚠️") ? "Attention" :
                   couponToast.includes("Loyalty") ? "Loyalty Reward" :
                   couponToast.includes("🚀") ? "Special Offer" :
                   couponToast.includes("📌") ? "Bill Status" :
                   couponToast.includes("💾") ? "Settings" :
                   "Success"}
                </span>
                <button onClick={() => setCouponToast("")} className="text-slate-300 hover:text-slate-600 transition-colors p-1 -mr-1">
                  <X size={14} strokeWidth={3} />
                </button>
              </div>
              <p className="text-xs font-extrabold text-slate-800 leading-snug">
                {couponToast.replace(/^[⚠️🎉✨💾🚀📌ℹ️]\s*/, "")}
              </p>
            </div>

            {/* Interactive Progress Bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-slate-100 w-full overflow-hidden">
              <div className={`h-full animate-[shrink-width_3.5s_linear_forwards] ${
                couponToast.includes("⚠️") ? "bg-amber-500" :
                couponToast.includes("Loyalty") ? "bg-indigo-500" :
                "bg-emerald-600"
              }`} />
            </div>
          </div>
        </div>
      )}


      {/* ══ SALE COMPLETED & THERMAL RECEIPT MODAL ══ */}
      {completedInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md animate-in fade-in p-4">
          <div className="w-[450px] max-h-[90vh] rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col animate-in zoom-in-95">
            
            {/* Header Banner */}
            <div className="px-6 py-4 text-white flex items-center justify-between shrink-0" style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs shadow-inner">
                  <CheckCircle2 size={24} strokeWidth={2.5} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">Payment Received!</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">Invoice #{completedInv.invoiceNo}</p>
                </div>
              </div>
              <button onClick={() => setCompletedInv(null)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
              
              {/* Payment Summary Box */}
              <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-2xs text-center space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Transaction Completed</p>
                <div className="flex items-center justify-center gap-3 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold">Bill Total</p>
                    <p className="text-base font-extrabold text-slate-800">৳ {completedInv.grandTotal.toFixed(2)}</p>
                  </div>
                  <div className="h-7 w-px bg-gray-200" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold">Cash Received</p>
                    <p className="text-base font-extrabold text-slate-800">৳ {(completedInv.paidAmount || completedInv.grandTotal).toFixed(2)}</p>
                  </div>
                  <div className="h-7 w-px bg-gray-200" />
                  <div>
                    <p className="text-[10px] text-emerald-600 font-bold">Change Return</p>
                    <p className="text-lg font-black text-emerald-600">৳ {(completedInv.changeReturn || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Printable 80mm Receipt Slip Container */}
              <div id="printable-thermal-receipt" className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm font-mono text-xs text-slate-800 space-y-3">
                
                {/* Shop Header */}
                <div className="text-center border-b border-dashed border-gray-300 pb-3 space-y-1">
                  <p className="text-base font-extrabold text-slate-950 tracking-tight uppercase">Blue Oceans Superstore</p>
                  <p className="text-[11px] text-slate-500">Dhaka Main Outlet • POS Terminal-01</p>
                  <p className="text-[10px] text-slate-400">BIN: 002938194-0101 • Mushak-6.3 Tax Invoice</p>
                </div>

                {/* Metadata */}
                <div className="space-y-1 text-[11px] text-slate-600 border-b border-dashed border-gray-300 pb-2">
                  <div className="flex justify-between">
                    <span>Invoice:</span>
                    <span className="font-bold text-slate-900">{completedInv.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date &amp; Time:</span>
                    <span>{completedInv.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-bold text-slate-900">{completedInv.customer}</span>
                  </div>
                </div>

                {/* Itemized List */}
                <div className="space-y-1.5 text-xs py-1 border-b border-dashed border-gray-300">
                  <div className="flex justify-between font-bold text-[10px] uppercase text-slate-400 pb-1">
                    <span>Item</span>
                    <span>Qty x Price</span>
                    <span>Total</span>
                  </div>
                  {(completedInv.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-[11px] py-0.5 border-b border-gray-50 last:border-0">
                      <div className="min-w-0 max-w-[170px]">
                        <p className="font-bold text-slate-800 truncate">{item.name}</p>
                      </div>
                      <div className="text-slate-500 font-mono text-[10px]">
                        {item.qty} {item.uom || "pcs"} x ৳{item.unitPrice.toFixed(2)}
                      </div>
                      <div className="font-bold text-slate-900 font-mono">
                        ৳{item.lineTotal.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="space-y-1 text-xs pt-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>৳{completedInv.subTotal.toFixed(2)}</span>
                  </div>
                  {completedInv.discAmt > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount Saved:</span>
                      <span>- ৳{completedInv.discAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-sm text-slate-900 border-t border-b border-gray-200 py-1 my-1">
                    <span>Net Bill Total:</span>
                    <span className="text-slate-900">৳{completedInv.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-semibold text-[11px]">
                    <span>Cash Received:</span>
                    <span>৳{(completedInv.paidAmount || completedInv.grandTotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-black text-sm pt-0.5">
                    <span>Change Returned:</span>
                    <span>৳{(completedInv.changeReturn || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Barcode & Footer */}
                <div className="text-center border-t border-dashed border-gray-300 pt-3 space-y-1">
                  <div className="flex justify-center py-1">
                    <div className="flex items-center gap-0.5 h-6 px-2 bg-gray-100 rounded">
                      <div className="w-0.5 h-5 bg-black" />
                      <div className="w-1 h-5 bg-black" />
                      <div className="w-0.5 h-5 bg-black" />
                      <div className="w-1.5 h-5 bg-black" />
                      <div className="w-0.5 h-5 bg-black" />
                      <div className="w-1 h-5 bg-black" />
                      <div className="w-0.5 h-5 bg-black" />
                      <div className="w-1.5 h-5 bg-black" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Thank you for your business!</p>
                  <p className="text-[9px] text-slate-400">Powered by Blue Oceans POS</p>
                </div>

              </div>

            </div>

            {/* Actions */}
            <div className="p-4 bg-white border-t border-gray-100 flex gap-2.5 shrink-0">
              <button onClick={() => window.print()} className="flex-1 py-3 rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer active:scale-95">
                <Printer size={16} /> Print Receipt (80mm)
              </button>
              <button onClick={() => setCompletedInv(null)} className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition cursor-pointer active:scale-95">
                <RotateCcw size={16} /> New Sale (F1)
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
    <style jsx global>{`
      @keyframes shrink-width {
        from { width: 100%; }
        to { width: 0%; }
      }
      @media print {
        body * {
          visibility: hidden !important;
        }
        #printable-thermal-receipt, #printable-thermal-receipt * {
          visibility: visible !important;
        }
        #printable-thermal-receipt {
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          width: 80mm !important;
          margin: 0 !important;
          padding: 12px !important;
          background: white !important;
          color: black !important;
          box-shadow: none !important;
          border: none !important;
          font-size: 11px !important;
        }
      }
    `}</style>
    </>
  );
}
