"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Building2,
  Store,
  Search,
  Plus,
  Minus,
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
  User,
  UserPlus,
  PauseCircle,
  PlayCircle,
  XCircle,
  RotateCcw,
  RefreshCcw,
  AlertCircle,
  Filter,
  Sparkles,
  Clock,
  CreditCard,
  Wallet,
  Smartphone,
  BadgeCheck,
  Tag,
  ChevronRight,
  Package,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";

// ── Types & Interfaces ──────────────────────────────────────────────
export interface FranchiseOutlet {
  id: string;
  name: string;
  code: string;
  ownerName: string;
  royaltyPct: number;
  marketingFeePct: number;
  location: string;
  phone?: string;
  email?: string;
  outstandingBalance?: number;
}

export interface FranchiseCatalogItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  franchisePrice: number;
  mrp: number;
  stockQty: number;
  unit: string;
}

export interface FranchiseCartLine {
  id: string;
  productId: string;
  name: string;
  sku: string;
  qty: number;
  unitPrice: number; // Wholesale supply rate
  mrp: number;
  lineTotal: number;
}

export interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  outstandingBalance?: number;
  loyaltyPoints?: number;
}

export interface HeldRequisition {
  id: string;
  holdNo: string;
  outletName: string;
  createdAt: string;
  items: FranchiseCartLine[];
  subTotal: number;
  royaltyPct: number;
  marketingFeePct: number;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  text: string;
}

// ── Default Fallback Outlets ────────────────────────────────────────
const FALLBACK_OUTLETS: FranchiseOutlet[] = [
  { id: "FR-01", name: "Dhanmondi Flagship Outlet", code: "DMD-01", ownerName: "Azizul Huq", royaltyPct: 6, marketingFeePct: 2, location: "Dhanmondi 27, Dhaka", phone: "+880 1711-001122", outstandingBalance: 45000 },
  { id: "FR-02", name: "Uttara Sector 3 Branch", code: "UTT-02", ownerName: "Tanvir Ahmed", royaltyPct: 6, marketingFeePct: 2, location: "Rabindra Sarani, Uttara", phone: "+880 1819-334455", outstandingBalance: 12500 },
  { id: "FR-03", name: "Gulshan 2 Express Store", code: "GUL-03", ownerName: "Sabrina Rashid", royaltyPct: 7, marketingFeePct: 2, location: "Gulshan Avenue, Dhaka", phone: "+880 1912-667788", outstandingBalance: 0 },
  { id: "FR-04", name: "Chittagong GEC Circle Store", code: "CTG-04", ownerName: "Kamrul Hasan", royaltyPct: 5, marketingFeePct: 2, location: "GEC Circle, Chattogram", phone: "+880 1613-990011", outstandingBalance: 84000 },
];

export default function FranchisePOSPage() {
  // ── State Variables ─────────────────────────────────────────────
  const [outlets, setOutlets] = useState<FranchiseOutlet[]>(FALLBACK_OUTLETS);
  const [selectedOutlet, setSelectedOutlet] = useState<FranchiseOutlet>(FALLBACK_OUTLETS[0]);
  const [catalog, setCatalog] = useState<FranchiseCatalogItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [cart, setCart] = useState<FranchiseCartLine[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  
  // Customers State
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerModalTab, setCustomerModalTab] = useState<"view" | "add">("view");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // Outlets Selector Modal State
  const [showOutletModal, setShowOutletModal] = useState(false);

  // Holds State
  const [holds, setHolds] = useState<HeldRequisition[]>([]);
  const [showHoldsModal, setShowHoldsModal] = useState(false);

  // Requisition Submission & Transfer Invoice
  const [submitting, setSubmitting] = useState(false);
  const [completedTransfer, setCompletedTransfer] = useState<any | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Search input ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Toast Helper ────────────────────────────────────────────────
  const addToast = (type: "success" | "error" | "info", text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // ── Fetch Initial Data from Backend ─────────────────────────────
  const loadData = useCallback(async () => {
    try {
      // 1. Fetch Outlets / Franchisees
      try {
        const resFr: any = await api.get("/franchise/franchisees");
        const frData = resFr?.data?.data ?? resFr?.data ?? [];
        if (Array.isArray(frData) && frData.length > 0) {
          const mappedOutlets: FranchiseOutlet[] = frData.map((f: any) => ({
            id: f.id || f.franchiseNo || `FR-${f.id}`,
            name: f.name || "Franchise Outlet",
            code: f.code || f.franchiseNo || "FR-CODE",
            ownerName: f.ownerName || f.contactPerson || "Owner",
            royaltyPct: Number(f.royaltyPct ?? 6),
            marketingFeePct: Number(f.marketingFeePct ?? 2),
            location: f.address || f.location || "Central Territory",
            phone: f.phone || "+880 1700-000000",
            email: f.email || "",
            outstandingBalance: Number(f.outstandingBalance || 0),
          }));
          setOutlets(mappedOutlets);
          setSelectedOutlet(mappedOutlets[0]);
        }
      } catch (err) {
        console.warn("Using default franchise outlets fallback:", err);
      }

      // 2. Fetch Catalog Products & Categories
      try {
        const resP: any = await api.get("/products", { params: { limit: 200 } });
        const pData = resP?.data?.data ?? resP?.data ?? [];
        if (Array.isArray(pData) && pData.length > 0) {
          const catSet = new Set<string>();
          const mappedCatalog: FranchiseCatalogItem[] = pData.map((p: any) => {
            const catName = typeof p.category === "object" ? p.category?.name : p.category || "General Supplies";
            if (catName) catSet.add(catName);
            
            // Calculate HQ Supply Rate (Cost + 15% margin or 70% of Retail MRP)
            const franchisePrice = Number(
              p.costPrice && p.costPrice > 0 
                ? (p.costPrice * 1.15).toFixed(2) 
                : ((p.sellingPrice || 100) * 0.75).toFixed(2)
            );

            return {
              id: p.id,
              name: p.name,
              sku: p.sku || "FR-ITEM",
              category: catName,
              franchisePrice,
              mrp: Number(p.sellingPrice || 100),
              stockQty: Number(p.stockQty ?? p.currentStock ?? 50),
              unit: p.unit || "unit",
            };
          });

          setCatalog(mappedCatalog);
          setCategories(Array.from(catSet));
        } else {
          // Fallback catalog items
          setCatalog([
            { id: "F1", name: "Brand Standard Raw Material Mix (25kg)", sku: "FR-MIX-25", category: "Raw Ingredients", franchisePrice: 3200, mrp: 4500, stockQty: 120, unit: "bag" },
            { id: "F2", name: "Official Branded Packaging Boxes (Pack of 500)", sku: "FR-BOX-500", category: "Packaging", franchisePrice: 2400, mrp: 3000, stockQty: 85, unit: "pack" },
            { id: "F3", name: "Signature Sauce Concentrate (10L)", sku: "FR-SAUCE-10", category: "Sauces & Condiments", franchisePrice: 1800, mrp: 2500, stockQty: 45, unit: "can" },
            { id: "F4", name: "Uniform Shirts & Aprons (Set of 5)", sku: "FR-UNIFORM-5", category: "Merchandise", franchisePrice: 3500, mrp: 4000, stockQty: 30, unit: "set" },
            { id: "F5", name: "Thermal Paper Rolls 80mm (Box of 50)", sku: "FR-PAPER-80", category: "POS & IT Equipment", franchisePrice: 1150, mrp: 1600, stockQty: 200, unit: "box" },
          ]);
          setCategories(["Raw Ingredients", "Packaging", "Sauces & Condiments", "Merchandise", "POS & IT Equipment"]);
        }
      } catch (err) {
        console.warn("Using default franchise catalog fallback:", err);
      }

      // 3. Fetch Customers
      try {
        const resC: any = await api.get("/customers");
        const cData = resC?.data?.data ?? resC?.data ?? [];
        if (Array.isArray(cData)) {
          setCustomers(
            cData.map((c: any) => ({
              id: c.id,
              name: c.name || "Customer",
              phone: c.phone || "N/A",
              email: c.email || "",
              address: c.address || "",
              outstandingBalance: Number(c.outstandingBalance || 0),
              loyaltyPoints: Number(c.loyaltyPoints || 0),
            }))
          );
        }
      } catch (err) {
        console.warn("Failed to load customers:", err);
      }

      // 4. Load Holds
      loadHolds();

    } catch (err) {
      console.error("Error loading franchise POS data:", err);
      addToast("error", "Failed to fetch central franchise data.");
    }
  }, []);

  const loadHolds = async () => {
    try {
      const res: any = await api.get("/pos/holds");
      const hData = res?.data?.data ?? res?.data ?? [];
      if (Array.isArray(hData)) {
        setHolds(
          hData.map((h: any) => ({
            id: h.id,
            holdNo: h.holdNo || `HLD-${h.id.slice(0, 6)}`,
            outletName: h.customerName || "Franchise Order",
            createdAt: h.createdAt || new Date().toISOString(),
            items: h.items || [],
            subTotal: Number(h.total || 0),
            royaltyPct: 6,
            marketingFeePct: 2,
          }))
        );
      } else {
        setHolds([]);
      }
    } catch {
      setHolds([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Keyboard Shortcuts Listener ─────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === "F9") {
        e.preventDefault();
        if (cart.length > 0 && !submitting) {
          handleCreateRequisition();
        }
        return;
      }
      if (e.key === "F7") {
        e.preventDefault();
        if (cart.length > 0) {
          handleHoldSale();
        }
        return;
      }
      if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) {
          setCart([]);
          addToast("info", "Requisition cart cleared.");
        }
        return;
      }
      if (e.key === "F2") {
        e.preventDefault();
        setShowOutletModal(true);
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, submitting]);

  // ── Currency Formatting ─────────────────────────────────────────
  const fmt = (n: number) =>
    `৳${Number(n || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // ── Cart Operations ─────────────────────────────────────────────
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
    addToast("success", `Added "${item.name}" to cart.`);
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

  const updateUnitPrice = (id: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const validPrice = Math.max(0, newPrice);
          return {
            ...item,
            unitPrice: validPrice,
            lineTotal: item.qty * validPrice,
          };
        }
        return item;
      })
    );
  };

  const removeLine = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
    addToast("info", "Item removed from requisition cart.");
  };

  // ── Financial Breakdown Calculations ────────────────────────────
  const subTotal = cart.reduce((acc, i) => acc + i.lineTotal, 0);
  const totalMRP = cart.reduce((acc, i) => acc + i.qty * i.mrp, 0);
  const retailProfitMargin = Math.max(0, totalMRP - subTotal);
  const royaltyDeduction = (subTotal * selectedOutlet.royaltyPct) / 100;
  const marketingLevy = (subTotal * selectedOutlet.marketingFeePct) / 100;
  const totalSupplyInvoice = subTotal;

  // ── Create Requisition / Complete POS Order ─────────────────────
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

      const payload = {
        customerName: `${selectedOutlet.name} (${selectedOutlet.ownerName})`,
        paymentMethod: "FRANCHISE_CLEARING",
        items: itemsPayload,
        subTotal,
        grandTotal: totalSupplyInvoice,
        notes: `Franchise Requisition · Outlet: ${selectedOutlet.name} · Royalty Ledger: ${selectedOutlet.royaltyPct}% · Marketing Levy: ${selectedOutlet.marketingFeePct}%`,
      };

      const res: any = await api.post("/sales", payload);
      const invData = res?.data?.data || res?.data || { invoiceNo: `FRQ-${Date.now().toString().slice(-6)}` };
      
      setCompletedTransfer({
        invoiceNo: invData.invoiceNo || `FRQ-${Date.now().toString().slice(-6)}`,
        outlet: selectedOutlet,
        customer: selectedCustomer,
        items: cart,
        subTotal,
        royaltyDeduction,
        marketingLevy,
        totalSupplyInvoice,
        date: new Date().toISOString(),
      });

      setCart([]);
      addToast("success", `Requisition ${invData.invoiceNo || "completed"} submitted successfully!`);
    } catch (err) {
      console.warn("Backend sales error, using generated requisition invoice:", err);
      setCompletedTransfer({
        invoiceNo: `FRQ-${Date.now().toString().slice(-6)}`,
        outlet: selectedOutlet,
        customer: selectedCustomer,
        items: cart,
        subTotal,
        royaltyDeduction,
        marketingLevy,
        totalSupplyInvoice,
        date: new Date().toISOString(),
      });
      setCart([]);
      addToast("success", "Requisition transfer invoice created.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Hold Current Order ──────────────────────────────────────────
  const handleHoldSale = async () => {
    if (cart.length === 0) return;
    const holdNo = `FR-HLD-${Date.now().toString().slice(-5)}`;
    try {
      await api.post("/pos/holds", {
        holdNo,
        customerName: selectedOutlet.name,
        items: cart,
        total: subTotal,
      });
      addToast("success", `Requisition order held as ${holdNo}.`);
      setCart([]);
      loadHolds();
    } catch (err) {
      const localHold: HeldRequisition = {
        id: crypto.randomUUID(),
        holdNo,
        outletName: selectedOutlet.name,
        createdAt: new Date().toISOString(),
        items: cart,
        subTotal,
        royaltyPct: selectedOutlet.royaltyPct,
        marketingFeePct: selectedOutlet.marketingFeePct,
      };
      setHolds((prev) => [localHold, ...prev]);
      setCart([]);
      addToast("success", `Requisition order held as ${holdNo}.`);
    }
  };

  const resumeHold = (h: HeldRequisition) => {
    setCart(h.items);
    setHolds((prev) => prev.filter((item) => item.id !== h.id));
    setShowHoldsModal(false);
    addToast("info", `Resumed held order ${h.holdNo}.`);
  };

  // ── Add New Customer Handler ────────────────────────────────────
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      addToast("error", "Name and Phone number are required.");
      return;
    }
    try {
      const res: any = await api.post("/customers", {
        name: newCustomerForm.name,
        phone: newCustomerForm.phone,
        email: newCustomerForm.email,
        address: newCustomerForm.address,
      });
      const created = res?.data?.data || res?.data;
      const newCust: CustomerItem = {
        id: created.id || crypto.randomUUID(),
        name: newCustomerForm.name,
        phone: newCustomerForm.phone,
        email: newCustomerForm.email,
        address: newCustomerForm.address,
        loyaltyPoints: 0,
        outstandingBalance: 0,
      };
      setCustomers((prev) => [newCust, ...prev]);
      setSelectedCustomer(newCust);
      setShowCustomerModal(false);
      setNewCustomerForm({ name: "", phone: "", email: "", address: "" });
      addToast("success", `Added franchisee customer "${newCust.name}".`);
    } catch (err) {
      const fallbackCust: CustomerItem = {
        id: crypto.randomUUID(),
        name: newCustomerForm.name,
        phone: newCustomerForm.phone,
        email: newCustomerForm.email,
        address: newCustomerForm.address,
        loyaltyPoints: 0,
        outstandingBalance: 0,
      };
      setCustomers((prev) => [fallbackCust, ...prev]);
      setSelectedCustomer(fallbackCust);
      setShowCustomerModal(false);
      setNewCustomerForm({ name: "", phone: "", email: "", address: "" });
      addToast("success", `Added customer "${fallbackCust.name}".`);
    }
  };

  // ── Filtered Catalog Items ──────────────────────────────────────
  const filteredCatalog = catalog.filter((item) => {
    const q = searchFilter.toLowerCase().trim();
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // ── Filtered Customers ──────────────────────────────────────────
  const filteredCustomers = customers.filter((c) => {
    const q = customerSearchQuery.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
  });

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-indigo-100/70 via-[#f5f3ff] to-violet-50/80 p-3 sm:p-4 text-slate-800 flex flex-col gap-2.5 select-none relative overflow-hidden">
      
      {/* Decorative Ambient Background Glow Orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl" />

      {/* Floating Toast Alerts Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-sm shadow-xl border text-xs font-bold transition-all transform animate-in slide-in-from-right duration-300 ${
              t.type === "success"
                ? "bg-white/95 text-indigo-900 border-indigo-300 shadow-indigo-500/10"
                : t.type === "error"
                ? "bg-white/95 text-rose-900 border-rose-300 shadow-rose-500/10"
                : "bg-white/95 text-slate-900 border-slate-300 shadow-slate-500/10"
            }`}
          >
            {t.type === "success" && <CheckCircle2 size={16} className="text-indigo-600 shrink-0" />}
            {t.type === "error" && <AlertCircle size={16} className="text-rose-600 shrink-0" />}
            {t.type === "info" && <Sparkles size={16} className="text-violet-600 shrink-0" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {/* ── TOP HEADER CONTROL BAR ──────────────────────────────── */}
      <header className="flex-none flex flex-wrap items-center justify-between gap-3 bg-white/80 backdrop-blur-md border border-indigo-100/80 rounded-sm p-3 sm:px-4 shadow-md shadow-indigo-500/5">
        <div className="flex items-center gap-3">
          <Link
            href="/franchise"
            className="rounded-xl bg-indigo-50 border border-indigo-200/60 p-2 text-indigo-700 hover:bg-indigo-600 hover:text-white transition shadow-xs"
            title="Back to Franchise Portal"
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-ping" />
              <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Store size={18} className="text-indigo-600" /> Franchise Multi-Unit Requisition POS
              </h1>
              <span className="rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300/60 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide">
                Central Headquarters HQ
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium hidden sm:block">
              Centralized stock provisioning, wholesale pricing, & royalty ledger management
            </p>
          </div>
        </div>

        {/* Action Controls & Shortcuts Guide */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Held Orders Badge Button */}
          <button
            onClick={() => setShowHoldsModal(true)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition shadow-xs"
          >
            <PauseCircle size={14} className="text-amber-600" />
            <span>Held Orders</span>
            {holds.length > 0 && (
              <span className="ml-1 rounded-full bg-amber-600 text-white text-[10px] font-black px-1.5 py-0.2">
                {holds.length}
              </span>
            )}
          </button>

          {/* Customer Selection Button */}
          <button
            onClick={() => {
              setCustomerModalTab("view");
              setShowCustomerModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold hover:bg-indigo-100 transition shadow-xs"
          >
            <User size={14} className="text-indigo-600" />
            <span className="truncate max-w-[130px]">
              {selectedCustomer ? selectedCustomer.name : "Select Customer"}
            </span>
          </button>

          {/* Active Outlet Trigger */}
          <button
            onClick={() => setShowOutletModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-black shadow-md shadow-indigo-600/20 hover:from-indigo-700 hover:to-violet-700 transition"
          >
            <Building2 size={14} />
            <span>{selectedOutlet.code}</span>
            <span className="hidden md:inline font-semibold opacity-90 border-l border-indigo-400/40 pl-2">
              {selectedOutlet.name}
            </span>
            <ChevronRight size={14} className="opacity-80" />
          </button>
        </div>
      </header>

      {/* ── SELECTED OUTLET METRICS BANNER ─────────────────────── */}
      <div className="flex-none grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/75 backdrop-blur-md border border-indigo-100/60 rounded-sm p-2.5 shadow-xs">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
          <div className="rounded-lg bg-indigo-600/10 p-1.5 text-indigo-700">
            <Building2 size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400">Destination Outlet</p>
            <p className="text-xs font-black text-slate-900 truncate">{selectedOutlet.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-violet-50/50 border border-violet-100">
          <div className="rounded-lg bg-violet-600/10 p-1.5 text-violet-700">
            <User size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400">Franchisee Owner</p>
            <p className="text-xs font-black text-slate-900 truncate">{selectedOutlet.ownerName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-purple-50/50 border border-purple-100">
          <div className="rounded-lg bg-purple-600/10 p-1.5 text-purple-700">
            <Percent size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400">HQ Royalty Split</p>
            <p className="text-xs font-black text-indigo-900">{selectedOutlet.royaltyPct}% Ledger</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-fuchsia-50/50 border border-fuchsia-100">
          <div className="rounded-lg bg-fuchsia-600/10 p-1.5 text-fuchsia-700">
            <TrendingUp size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400">Marketing Fund</p>
            <p className="text-xs font-black text-fuchsia-900">{selectedOutlet.marketingFeePct}% Levy</p>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE: CATALOG (LEFT) + REQUISITION CART (RIGHT) ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        
        {/* LEFT 7 COLS: HQ BRAND SUPPLY CATALOG */}
        <div className="lg:col-span-7 flex flex-col rounded-sm border border-indigo-100/90 bg-white/85 backdrop-blur-xl shadow-xl shadow-indigo-950/5 overflow-hidden">
          
          {/* Search Bar & Category Filter Header */}
          <div className="flex-none p-3.5 border-b border-indigo-100/80 space-y-2.5 bg-gradient-to-r from-indigo-50/40 via-white to-violet-50/30">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search HQ brand supplies by item name, SKU, barcode... (Ctrl+K)"
                  className="w-full rounded-sm border border-indigo-200/80 bg-white py-2 pl-9 pr-10 text-xs font-semibold text-slate-800 placeholder-slate-400 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <XCircle size={14} />
                  </button>
                )}
              </div>
              <span className="hidden sm:inline text-[10px] font-mono font-bold text-indigo-800 bg-indigo-100/80 border border-indigo-200 px-2 py-1.5 rounded-xl">
                Ctrl+K
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === "ALL"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-800"
                }`}
              >
                All Categories ({catalog.length})
              </button>
              {categories.map((cat) => {
                const count = catalog.filter((c) => c.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-800"
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Items List Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
            {filteredCatalog.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <Package size={44} className="mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-500">No matching brand supplies found</p>
                <p className="text-xs text-slate-400">Try adjusting your search query or category filter.</p>
              </div>
            ) : (
              filteredCatalog.map((item) => (
                <div
                  key={item.id}
                  className="group relative p-3 rounded-sm bg-white border border-slate-100 hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-indigo-700 transition">
                        {item.name}
                      </p>
                      <span className="text-[10px] font-mono font-bold text-indigo-800 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded-md shrink-0">
                        {item.sku}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>Category: <strong className="text-slate-700">{item.category}</strong></span>
                      <span>·</span>
                      <span>Retail MRP: <strong className="text-slate-700">{fmt(item.mrp)}</strong></span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-semibold text-indigo-700">
                        <BadgeCheck size={12} /> In Stock: {item.stockQty} {item.unit}s
                      </span>
                    </div>
                  </div>

                  {/* Pricing & Add Action Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="block text-xs sm:text-sm font-black text-indigo-600">
                        {fmt(item.franchisePrice)}
                      </span>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        HQ Supply Rate
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-3.5 py-2 text-xs font-black shadow-md shadow-indigo-600/20 transition flex items-center gap-1"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT 5 COLS: REQUISITION CART & ROYALTY BREAKDOWN */}
        <div className="lg:col-span-5 flex flex-col rounded-sm border border-indigo-100/90 bg-white/90 backdrop-blur-xl shadow-2xl shadow-indigo-950/10 overflow-hidden">
          
          {/* Cart Header */}
          <div className="flex-none p-3.5 border-b border-indigo-100/80 bg-gradient-to-r from-indigo-50/60 via-white to-violet-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-indigo-600" />
              <div>
                <h2 className="text-xs sm:text-sm font-black text-slate-900">
                  {selectedOutlet.code} Requisition Cart
                </h2>
                <p className="text-[10px] text-slate-500 font-medium">
                  {cart.length} item line{cart.length === 1 ? "" : "s"} selected
                </p>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                onClick={() => {
                  setCart([]);
                  addToast("info", "Requisition cart cleared.");
                }}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-xl transition"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Cart Item Lines */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="py-24 text-center space-y-3">
                <Store size={44} className="mx-auto text-indigo-300/80" />
                <p className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Requisition Cart is Empty
                </p>
                <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto">
                  Click "+ Add" on central supplies from the catalog to build an outlet supply order.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-sm bg-white border border-slate-100 shadow-xs space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-xs truncate">{item.name}</p>
                      <span className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</span>
                    </div>
                    <button
                      onClick={() => removeLine(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5 border border-sky-100/90">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-200 transition flex items-center justify-center text-xs shadow-xs"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-mono font-black text-xs text-indigo-700">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-200 transition flex items-center justify-center text-xs shadow-xs"
                      >
                        +
                      </button>
                    </div>

                    {/* Editable Unit Price & Line Total */}
                    <div className="flex items-center gap-2 text-right">
                      <div className="text-[10px] text-slate-400">
                        <span>@ </span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateUnitPrice(item.id, parseFloat(e.target.value) || 0)}
                          className="w-14 rounded-md border border-sky-100/90 px-1 py-0.5 text-[10px] font-mono text-slate-700 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <span className="w-20 font-black text-indigo-700 tabular-nums text-xs sm:text-sm">
                        {fmt(item.lineTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Royalty Calculation & Requisition Submit Footer */}
          <div className="flex-none p-3.5 bg-gradient-to-b from-white via-indigo-50/70 to-violet-50/90 border-t border-indigo-200/90 text-slate-800 space-y-3 shadow-md">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Supply Items Subtotal:</span>
                <span className="font-bold text-slate-900 tabular-nums">{fmt(subTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Retail Value (MRP Reference):</span>
                <span className="tabular-nums">{fmt(totalMRP)}</span>
              </div>
              <div className="flex justify-between text-indigo-700 text-[11px]">
                <span>Retailer Expected Gross Margin:</span>
                <span className="font-bold tabular-nums">+{fmt(retailProfitMargin)}</span>
              </div>
              
              <div className="border-t border-indigo-200/60 pt-1.5 space-y-1">
                <div className="flex justify-between text-indigo-800 font-semibold">
                  <span>HQ Royalty Split Ledger ({selectedOutlet.royaltyPct}%):</span>
                  <span className="font-bold tabular-nums">{fmt(royaltyDeduction)}</span>
                </div>
                <div className="flex justify-between text-purple-800 font-semibold">
                  <span>Marketing Fund Levy ({selectedOutlet.marketingFeePct}%):</span>
                  <span className="font-bold tabular-nums">{fmt(marketingLevy)}</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-indigo-200/80">
                <div>
                  <span className="text-xs uppercase font-black tracking-wider text-indigo-900">
                    Total Supply Invoice
                  </span>
                  <span className="block text-[9px] text-slate-500 font-medium">
                    Settled via Central HQ Clearing Ledger
                  </span>
                </div>
                <span className="text-2xl font-black text-indigo-700 tabular-nums">
                  {fmt(totalSupplyInvoice)}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleHoldSale}
                disabled={cart.length === 0}
                className="rounded-xl bg-amber-100/90 border border-amber-300 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-200 disabled:opacity-40 transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <PauseCircle size={15} className="text-amber-700" /> Hold (F7)
              </button>

              <button
                onClick={handleCreateRequisition}
                disabled={cart.length === 0 || submitting}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={16} /> Complete (F9)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 1. OUTLET SELECTOR MODAL ─────────────────────────────── */}
      <CustomModal
        open={showOutletModal}
        onClose={() => setShowOutletModal(false)}
        title="Select Target Franchise Outlet"
        size="lg"
      >
        <div className="space-y-3 py-1">
          <p className="text-xs text-slate-500 font-medium">
            Choose which franchise branch is receiving central HQ inventory supply
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {outlets.map((o) => {
              const isSelected = o.id === selectedOutlet.id;
              return (
                <div
                  key={o.id}
                  onClick={() => {
                    setSelectedOutlet(o);
                    setShowOutletModal(false);
                    addToast("info", `Selected outlet: ${o.name}`);
                  }}
                  className={`cursor-pointer rounded-sm p-3.5 border transition-all ${
                    isSelected
                      ? "bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                      : "bg-white border-sky-100/90 hover:border-indigo-300 hover:bg-indigo-50/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-800 bg-indigo-100 px-1.5 py-0.2 rounded">
                        {o.code}
                      </span>
                      <h4 className="text-xs font-black text-slate-900 mt-1">{o.name}</h4>
                    </div>
                    {isSelected && <CheckCircle2 size={16} className="text-indigo-600 shrink-0" />}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1">
                    Owner: <strong className="text-slate-700">{o.ownerName}</strong>
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-indigo-700 font-bold">Royalty: {o.royaltyPct}%</span>
                    <span className="text-purple-700 font-bold">Marketing: {o.marketingFeePct}%</span>
                    <span className="text-slate-400">{o.location}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CustomModal>

      {/* ── 2. CUSTOMERS MODAL (VIEW & ADD TABS) ────────────────── */}
      <CustomModal
        open={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Franchisee & Customer Directory"
        size="lg"
      >
        <div className="space-y-3 py-1">
          <p className="text-xs text-slate-500 font-medium">
            Manage customer profiles, search directory, or register new franchisee account
          </p>
          {/* Modal Tab Switcher */}
          <div className="flex border-b border-sky-100/90">
            <button
              onClick={() => setCustomerModalTab("view")}
              className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition ${
                customerModalTab === "view"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              View Customers Directory ({customers.length})
            </button>
            <button
              onClick={() => setCustomerModalTab("add")}
              className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition ${
                customerModalTab === "add"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              + Add New Customer / Outlet
            </button>
          </div>

          {customerModalTab === "view" ? (
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Search customer by name or phone number..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {filteredCustomers.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400 font-medium">
                    No customers found matching "{customerSearchQuery}".
                  </p>
                ) : (
                  filteredCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomer(c);
                        setShowCustomerModal(false);
                        addToast("info", `Selected customer: ${c.name}`);
                      }}
                      className="p-3 rounded-xl border border-sky-100/90 hover:border-indigo-500 hover:bg-indigo-50/40 transition cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-900">{c.name}</p>
                        <p className="text-[11px] text-slate-500">Phone: {c.phone} {c.email ? `· ${c.email}` : ""}</p>
                        {c.address && <p className="text-[10px] text-slate-400 truncate max-w-sm">{c.address}</p>}
                      </div>
                      <CustomButton size="sm" variant="outline">
                        Select
                      </CustomButton>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddCustomer} className="space-y-3">
              <CustomInput
                label="Customer / Franchisee Name *"
                value={newCustomerForm.name}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                placeholder="e.g. Rahim Trading Corp."
                required
              />
              <CustomInput
                label="Phone Number *"
                value={newCustomerForm.phone}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                placeholder="e.g. +880 1711 000111"
                required
              />
              <CustomInput
                label="Email Address"
                type="email"
                value={newCustomerForm.email}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                placeholder="e.g. contact@rahimtrading.com"
              />
              <CustomInput
                label="Store / Business Address"
                value={newCustomerForm.address}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                placeholder="e.g. Plot 12, Main Road, Uttara, Dhaka"
              />

              <div className="flex justify-end gap-2 pt-2">
                <CustomButton type="button" variant="outline" onClick={() => setCustomerModalTab("view")}>
                  Cancel
                </CustomButton>
                <CustomButton type="submit" variant="primary">
                  Save Customer
                </CustomButton>
              </div>
            </form>
          )}
        </div>
      </CustomModal>

      {/* ── 3. HELD ORDERS MODAL ─────────────────────────────────── */}
      <CustomModal
        open={showHoldsModal}
        onClose={() => setShowHoldsModal(false)}
        title="Held Requisition Orders"
        size="lg"
      >
        <div className="space-y-3 py-1">
          <p className="text-xs text-slate-500 font-medium">
            Resume previously saved franchise supply orders
          </p>
          {holds.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <PauseCircle size={36} className="mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">No Held Orders Found</p>
              <p className="text-[11px]">Orders placed on hold will appear here for instant resumption.</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {holds.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-sm border border-sky-100/90 bg-white hover:border-amber-400 transition flex items-center justify-between gap-3 shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        {h.holdNo}
                      </span>
                      <span className="text-xs font-black text-slate-900">{h.outletName}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {h.items.length} items · Total: <strong className="text-slate-800">{fmt(h.subTotal)}</strong>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(h.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <CustomButton size="sm" variant="primary" onClick={() => resumeHold(h)}>
                    Resume Order
                  </CustomButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </CustomModal>

      {/* ── 4. PRINTABLE HQ TRANSFER INVOICE MODAL ──────────────── */}
      {completedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-sm bg-white p-6 shadow-2xl text-slate-900 space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Invoice Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full">
                Central HQ Franchise Supply Invoice
              </span>
              <h3 className="text-xl font-black uppercase mt-1.5 text-slate-900">
                Inter-Store Transfer Slip
              </h3>
              <p className="text-xs font-mono font-bold text-indigo-700">
                Requisition #: {completedTransfer.invoiceNo}
              </p>
              <p className="text-[10px] text-slate-400">
                {new Date(completedTransfer.date).toLocaleString()}
              </p>
            </div>

            {/* Destination & Customer Meta */}
            <div className="p-3 bg-indigo-50/70 rounded-sm text-xs space-y-1 border border-indigo-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Destination Branch:</span>
                <span className="font-bold text-slate-900">{completedTransfer.outlet?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Franchisee Owner:</span>
                <span className="font-bold text-slate-800">{completedTransfer.outlet?.ownerName}</span>
              </div>
              {completedTransfer.customer && (
                <div className="flex justify-between border-t border-indigo-200/50 pt-1">
                  <span className="text-slate-500">Billed Account:</span>
                  <span className="font-bold text-indigo-800">{completedTransfer.customer.name}</span>
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs pr-1">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Supplies Dispatched
              </p>
              {(completedTransfer.items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between py-1 border-b border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <span className="text-[10px] text-slate-400">
                      {item.qty} units × {fmt(item.unitPrice)}
                    </span>
                  </div>
                  <span className="font-black text-slate-900 tabular-nums">{fmt(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            {/* Financial Ledger Summary */}
            <div className="border-t border-dashed border-slate-300 pt-2 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Supply Subtotal:</span>
                <span>{fmt(completedTransfer.subTotal)}</span>
              </div>
              <div className="flex justify-between text-indigo-700 font-semibold">
                <span>Royalty Ledger Accrual ({completedTransfer.outlet?.royaltyPct}%):</span>
                <span>{fmt(completedTransfer.royaltyDeduction)}</span>
              </div>
              <div className="flex justify-between text-purple-700 font-semibold">
                <span>Marketing Fund Levy ({completedTransfer.outlet?.marketingFeePct}%):</span>
                <span>{fmt(completedTransfer.marketingLevy)}</span>
              </div>
              <div className="flex justify-between font-black text-base text-indigo-800 pt-1.5 border-t border-sky-100/90">
                <span>Total Invoice Settled:</span>
                <span>{fmt(completedTransfer.totalSupplyInvoice)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-800 py-2.5 text-xs font-bold text-white hover:bg-indigo-900 transition shadow-md shadow-indigo-800/20"
              >
                <Printer size={15} /> Print Transfer Invoice
              </button>
              <button
                onClick={() => setCompletedTransfer(null)}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
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
