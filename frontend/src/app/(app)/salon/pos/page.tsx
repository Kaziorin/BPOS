"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ChevronLeft,
  Clock,
  CheckCircle2,
  ShoppingCart,
  LayoutGrid,
  List,
  Scissors,
  Sparkles,
  Droplets,
  Palette,
  Wind,
  Smile,
  Package,
  Box,
  Monitor,
  Wifi,
  Maximize,
  Bell,
  Calendar,
  User,
  Settings,
  History,
  TrendingUp,
  FileText,
  Star,
  X,
  CreditCard,
  ArrowRight,
  PauseCircle,
  Gift,
  DollarSign,
  Printer,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { CustomModal, CustomInput, CustomButton, CustomSelect } from "@/components/custom";
import { toast } from "react-toastify";
import { ReceiptModal } from "../../retail-pos/ReceiptModal";
import type { SaleResult, PaymentLine } from "../../retail-pos/pos-types";
import { fetchAllProducts } from "@/lib/catalog";

// --- Types ---
interface SalonItem {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  image: string;
  badge?: string;
  type: "service" | "product";
}

interface AddOn {
  id: string;
  name: string;
  duration: string;
  price: number;
  image: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface CartItem extends SalonItem {
  qty: number;
  stylistId?: string;
  stylistName?: string;
}

// --- Constants & Demo Data ---
const CATEGORIES = [
  { id: "all", label: "All Services", icon: LayoutGrid },
  { id: "hair", label: "Hair Care", icon: Scissors },
  { id: "skin", label: "Skin Care", icon: Droplets },
  { id: "nail", label: "Nail Care", icon: Palette },
  { id: "makeup", label: "Makeup", icon: Wind },
  { id: "massage", label: "Massage", icon: Smile },
  { id: "facial", label: "Facial", icon: Sparkles },
  { id: "packages", label: "Packages", icon: Box },
  { id: "products", label: "Products", icon: Package },
];

const DEMO_ADDONS: AddOn[] = [
  { id: "a1", name: "Hair Wash & Blow Dry", duration: "20 min", price: 300, image: "https://images.unsplash.com/photo-1560869713-7d0a29430039?q=80&w=100&auto=format&fit=crop" },
  { id: "a2", name: "Hair Serum Treatment", duration: "15 min", price: 400, image: "https://images.unsplash.com/photo-1527799822341-47100b3d746d?q=80&w=100&auto=format&fit=crop" },
  { id: "a3", name: "Nail Art Design", duration: "15 min", price: 300, image: "https://images.unsplash.com/photo-1604654894610-df490601f626?q=80&w=100&auto=format&fit=crop" },
  { id: "a4", name: "Premium Face Mask", duration: "15 min", price: 350, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=100&auto=format&fit=crop" },
];

const CHECKOUT_METHODS = [
  { id: "CASH", label: "Cash", icon: <DollarSign size={20} /> },
  { id: "CARD", label: "Card", icon: <CreditCard size={20} /> },
  { id: "MOBILE", label: "Mobile", icon: <Monitor size={20} /> },
  { id: "BANK", label: "Bank", icon: <TrendingUp size={20} /> },
  { id: "CREDIT", label: "Credit", icon: <Gift size={20} /> },
] as const;

const CASH_DENOMINATIONS = [10, 20, 50, 100, 200, 500, 1000, 2000];

export default function SalonPOSPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("bpos_salon_cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal States
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [isHeldOrdersOpen, setHeldOrdersOpen] = useState(false);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [isCustomerOpen, setCustomerOpen] = useState(false);
  const [customerModalTab, setCustomerModalTab] = useState<"view" | "add">("view");
  const [isNotesOpen, setNotesOpen] = useState(false);
  const [isStaffOpen, setStaffOpen] = useState(false);
  const [selectedCartIdx, setSelectedCartIdx] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SaleResult | null>(null);
  const [completedSale, setCompletedSale] = useState<{ result: SaleResult, cart: any[], payments: any[], cashierName: string, customerName: string } | null>(null);

  const [cashTenderedInput, setCashTenderedInput] = useState("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const [checkoutPayMethod, setCheckoutPayMethod] = useState<"CASH" | "CARD" | "MOBILE" | "BANK" | "CREDIT">("CASH");

  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", address: "" });
  const [globalStylistId, setGlobalStylistId] = useState("");
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [servicesList, setServicesList] = useState<SalonItem[]>([]);
  const [productsList, setProductsList] = useState<SalonItem[]>([]);
  const [heldOrders, setHeldOrders] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("bpos_salon_held");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [tipInput, setTipInput] = useState("");
  const [isAppointment, setIsAppointment] = useState(false);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [orderSeq] = useState(() => `ORD-${Math.floor(Math.random() * 9000) + 1000}`);

  useEffect(() => {
    try { localStorage.setItem("bpos_salon_cart", JSON.stringify(cart)); } catch {}
  }, [cart]);

  useEffect(() => {
    try { localStorage.setItem("bpos_salon_held", JSON.stringify(heldOrders)); } catch {}
  }, [heldOrders]);

  // Load Data
  useEffect(() => {
    // Load Sales History
    api.get("/api/v1/pos/sales?limit=20").then((res: any) => {
      const data = res?.data?.data || res?.data || [];
      if (Array.isArray(data)) setSalesHistory(data);
    }).catch(() => {});

    // Load Customers
    api.get("/customers").then((res: any) => {
      setCustomers(res?.data?.data || res?.data || []);
    }).catch(() => {});

    // Load Services
    api.get("/v1/salon/services?activeOnly=true").then((res: any) => {
      const data = res?.data || [];
      setServicesList(data.map((s: any) => ({
        id: s.productId, // Use productId for cart/checkout compatibility
        name: s.name,
        category: s.category?.toLowerCase() || "hair",
        price: Number(s.price),
        duration: `${s.durationMin} min`,
        image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=400&auto=format&fit=crop", // placeholder
        type: "service" as const
      })));
    }).catch(() => {});

    // Load Products
    fetchAllProducts().then(prods => {
      // Filter out non-sellable products if needed, or just map them
      setProductsList(prods.map(p => ({
        id: p.id,
        name: p.name,
        category: "products",
        price: Number(p.sellingPrice),
        duration: p.unit || "unit",
        image: p.imageUrl || "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=200&auto=format&fit=crop",
        type: "product" as const
      })));
    }).catch(() => {});

    // Load Staff
    api.get("/v1/salon/staff").then((res: any) => {
      const data = res?.data || [];
      const st = data.map((s: any) => ({
        id: s.id, // Using employee ID, or we can use userId (s.userId) if we need to link to sales user. The backend expects staffId (which is employeeId) or userId? Wait, backend commission uses employeeId (s.id).
        name: s.name,
        role: s.designationName || s.departmentName || "Staff"
      }));
      setStaffList(st);
      if (st.length > 0) setGlobalStylistId(st[0].id);
    }).catch(() => {});

  }, []);

  // --- Computed ---
  const selectedCustomer = useMemo(() => customers.find(c => (c.id || c._id) === customerId), [customers, customerId]);
  const selectedGlobalStylist = useMemo(() => staffList.find(s => s.id === globalStylistId), [globalStylistId, staffList]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  }, [customers, customerSearch]);

  const filteredServices = useMemo(() => {
    return servicesList.filter(s => {
      const matchesCat = activeCategory === "all" || s.category === activeCategory;
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [servicesList, activeCategory, searchQuery]);

  const filteredProducts = useMemo(() => {
    return productsList.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [productsList, searchQuery]);

  const baseSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }, [cart]);

  const addonsTotal = useMemo(() => {
    return selectedAddOnIds.reduce((acc, id) => {
      const ao = DEMO_ADDONS.find(a => a.id === id);
      return acc + (ao?.price || 0);
    }, 0);
  }, [selectedAddOnIds]);

  const subtotal = baseSubtotal + addonsTotal;

  const discountValue = useMemo(() => {
    const val = parseFloat(discountInput) || 0;
    if (discountType === "percent") return (subtotal * val) / 100;
    return val;
  }, [subtotal, discountInput, discountType]);

  const tipValue = useMemo(() => {
    return parseFloat(tipInput) || 0;
  }, [tipInput]);

  const loyaltyValue = useMemo(() => {
    if (!useLoyaltyPoints || !selectedCustomer) return 0;
    return Math.min(subtotal - discountValue, (selectedCustomer.loyalty_points || 0) / 10);
  }, [useLoyaltyPoints, selectedCustomer, subtotal, discountValue]);

  const tax = Math.max(0, subtotal - discountValue - loyaltyValue) * 0.15;
  const total = Math.max(0, subtotal - discountValue - loyaltyValue + tax + tipValue);

  // --- Handlers ---
  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    if (catId === "products") {
      setActiveTab("products");
    } else {
      setActiveTab("services");
    }
  };

  const addToCart = (item: SalonItem) => {
    const staff = staffList.find(s => s.id === globalStylistId) || staffList[0] || { id: "none", name: "No Staff", role: "N/A" };
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1, stylistId: staff.id, stylistName: staff.name }];
    });
  };

  const assignStaff = (staff: Staff) => {
    if (selectedCartIdx !== null) {
      setCart(prev => {
        const next = [...prev];
        next[selectedCartIdx] = { ...next[selectedCartIdx], stylistId: staff.id, stylistName: staff.name };
        return next;
      });
      setSelectedCartIdx(null);
      toast.success(`Service assigned to ${staff.name}`);
    } else {
      setGlobalStylistId(staff.id);
      toast.success(`Default stylist set to ${staff.name}`);
    }
    setStaffOpen(false);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const onClearCart = () => {
    setCart([]);
    setSelectedAddOnIds([]);
    setOrderNote("");
    setDiscountInput("");
    setTipInput("");
    toast.info("Cart cleared");
  };

  const holdOrder = () => {
    if (cart.length === 0) return;
    const newHold = {
      id: `HOLD-${Date.now().toString().slice(-4)}`,
      items: [...cart],
      selectedAddOnIds: [...selectedAddOnIds],
      note: orderNote,
      time: new Date().toLocaleTimeString(),
      total,
    };
    setHeldOrders(prev => [newHold, ...prev]);
    onClearCart();
    toast.success("Order held successfully");
  };

  const recallOrder = (held: any) => {
    setCart(held.items);
    setSelectedAddOnIds(held.selectedAddOnIds);
    setOrderNote(held.note);
    setHeldOrders(prev => prev.filter(h => h.id !== held.id));
    setHeldOrdersOpen(false);
    toast.success("Order recalled");
  };

  const confirmSale = async (paymentMethod: string = "CASH") => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const tendered = parseFloat(cashTenderedInput) || total;

      const items = cart.map(item => ({
        productId: item.id,
        variantId: null,
        name: item.name,
        qty: item.qty,
        unitPrice: item.price,
        lineTotal: item.price * item.qty,
      }));

      selectedAddOnIds.forEach(id => {
        const addon = DEMO_ADDONS.find(a => a.id === id);
        if (addon) {
          items.push({
            productId: addon.id,
            variantId: null,
            name: `Addon: ${addon.name}`,
            qty: 1,
            unitPrice: addon.price,
            lineTotal: addon.price,
          });
        }
      });

      const payload = {
        customerId: customerId || null,
        items,
        payments: [{ method: paymentMethod, amount: paymentMethod === "CASH" ? tendered : total }],
        subTotal: baseSubtotal + addonsTotal,
        discountTotal: discountValue + loyaltyValue,
        taxTotal: tax,
        tipTotal: tipValue,
        grandTotal: total,
        note: orderNote || (isAppointment ? "[Pre-booked Appointment]" : "[Walk-in Client]"),
      };

      const res: any = await api.post("/api/v1/pos/confirm", payload);
      const saleResult = res?.data || res;
      setResult(saleResult);
      setCompletedSale({
        result: saleResult,
        cart: items,
        payments: payload.payments,
        customerName: selectedCustomer?.name || "Walk-in",
        cashierName: user?.name || "Staff",
      });
      setSalesHistory(prev => [{ ...saleResult, customerName: selectedCustomer?.name || "Walk-in" }, ...prev]);
      setCheckoutOpen(false);
      toast.success("Sale confirmed!");
    } catch (err: any) {
      toast.error(err.message || "Failed to process sale");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error("Name and Phone are required");
      return;
    }
    setSubmitting(true);
    try {
      const res: any = await api.post("/api/v1/customers", newCustomer);
      const saved = res?.data || res;
      setCustomers(prev => [saved, ...prev]);
      setCustomerId(saved.id || saved._id);
      setNewCustomer({ name: "", phone: "", email: "", address: "" });
      setCustomerModalTab("view");
      setCustomerOpen(false);
      toast.success("Customer added successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to add customer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <div className="h-screen w-screen flex flex-col bg-[#F8F9FE] overflow-hidden text-slate-800" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
      
      {/* Premium Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-100/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-100/50 blur-[100px]" />
      </div>

      {/* --- TOP HEADER --- */}
      <header className="flex-none h-[72px] px-8 flex items-center justify-between gap-8 bg-white/70 backdrop-blur-xl border-b border-indigo-50 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-12 h-12 rounded-2xl bg-white border border-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm">
            <ChevronLeft size={24} />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-200 rotate-3 transform transition hover:rotate-0">
            <Smile size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none text-indigo-950">Glow & Style</h1>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Beauty Salon & Spa
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-xl relative group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search premium services or luxury products..."
            className="w-full h-[46px] rounded-2xl bg-white/80 border border-indigo-50/50 px-12 text-sm font-semibold text-slate-700 focus:border-indigo-400 focus:ring-8 focus:ring-indigo-50/50 transition-all outline-none shadow-sm"
          />
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden xl:flex items-center gap-4 bg-white/80 px-5 py-2.5 rounded-2xl shadow-sm border border-indigo-50/50">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Calendar size={18} />
            </div>
            <div className="text-right leading-tight">
              <p className="text-xs font-black text-slate-900 tracking-tight">20 May, 2025</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tue, 10:30 AM</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-white/80 pl-2 pr-5 py-1.5 rounded-full border border-indigo-50/50 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden ring-1 ring-indigo-50">
              <User size={20} className="text-slate-500" />
            </div>
            <div className="hidden sm:block leading-none">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Operator</p>
              <p className="text-xs font-black text-indigo-950 mt-1 uppercase tracking-tight">{user?.name || "Staff"}</p>
            </div>
          </div>

          <button onClick={() => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }} className="w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center shadow-sm border border-slate-200 transition-all active:scale-95">
            <Maximize size={20} />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm border border-emerald-100/50">
            <Wifi size={20} />
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 relative">

        {/* --- LEFT NAVIGATION --- */}
        <aside className="w-[100px] lg:w-44 flex-none flex flex-col gap-2 p-4 bg-white/50 backdrop-blur-md border-r border-indigo-50 z-20 overflow-y-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2.5 p-4 rounded-[2rem] transition-all duration-300 group relative",
                  active
                    ? "bg-indigo-600 text-white shadow-[0_15px_30px_-5px_rgba(79,70,229,0.3)] -translate-y-1"
                    : "text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-xl hover:shadow-indigo-100/50"
                )}
              >
                <div className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500",
                  active ? "bg-white/20 rotate-12" : "bg-slate-100 group-hover:bg-indigo-50 group-hover:rotate-6"
                )}>
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} className={cn(active ? "text-white" : "text-slate-500 group-hover:text-indigo-600")} />
                </div>
                <span className="text-[10px] font-black text-center leading-tight tracking-wider uppercase">{cat.label.split(' ')[0]}</span>
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-lg" />}
              </button>
            );
          })}
        </aside>

        {/* --- CENTER AREA --- */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white/20 backdrop-blur-sm">
          {/* Section Header with Mode Toggles */}
          <div className="flex-none px-8 py-8 flex items-center justify-between">
            <div className="flex items-center gap-3 bg-white/80 p-1.5 rounded-[2.5rem] border border-indigo-50/50 shadow-xl shadow-indigo-100/20 backdrop-blur-md">
              <button
                onClick={() => setActiveTab("services")}
                className={cn(
                  "px-8 py-2.5 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all duration-500",
                  activeTab === "services" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                )}
              >
                Services
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={cn(
                  "px-8 py-2.5 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all duration-500",
                  activeTab === "products" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                )}
              >
                Retail Store
              </button>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 bg-white/60 p-1 rounded-2xl border border-indigo-50/50">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn("p-2 rounded-xl transition-all duration-300", viewMode === "grid" ? "bg-white text-indigo-600 shadow-md ring-1 ring-indigo-50" : "text-slate-400 hover:text-indigo-600")}
                >
                  <LayoutGrid size={16} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn("p-2 rounded-xl transition-all duration-300", viewMode === "list" ? "bg-white text-indigo-600 shadow-md ring-1 ring-indigo-50" : "text-slate-400 hover:text-indigo-600")}
                >
                  <List size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-8 pb-10 space-y-12">

            {activeTab === "services" ? (
              <section className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-10 rounded-full bg-indigo-600 shadow-lg shadow-indigo-200" />
                    <h3 className="text-2xl font-black text-indigo-950 uppercase tracking-tight">
                      {CATEGORIES.find(c => c.id === activeCategory)?.label || "Selection Catalog"}
                    </h3>
                  </div>
                  <button className="flex items-center gap-2 group">
                    <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">Full List</span>
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                      <ChevronRight size={16} strokeWidth={3} />
                    </div>
                  </button>
                </div>

                <div className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8"
                    : "space-y-5"
                )}>
                  {filteredServices.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => addToCart(s)}
                      className={cn(
                        "group relative bg-white rounded-[3rem] border border-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-[0_40px_80px_rgba(79,70,229,0.15)] hover:-translate-y-3 transition-all duration-700 cursor-pointer flex overflow-hidden",
                        viewMode === "grid" ? "flex-col" : "flex-row items-center gap-8"
                      )}
                    >
                      <div className={cn(
                        "relative rounded-[2.5rem] overflow-hidden bg-slate-50 shrink-0",
                        viewMode === "grid" ? "aspect-[4/3] w-full mb-6" : "h-32 w-44"
                      )}>
                        <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        {s.badge && (
                          <div className="absolute top-5 left-5 px-4 py-1.5 rounded-full text-[9px] font-black text-white shadow-xl backdrop-blur-md bg-indigo-600/90 tracking-widest uppercase animate-pulse">
                            {s.badge}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-2">
                           <h3 className="font-black text-base text-indigo-950 truncate uppercase tracking-tight">{s.name}</h3>
                           <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase bg-slate-50 px-3 py-1 rounded-full">
                              <Clock size={12} strokeWidth={2.5} /> {s.duration}
                           </div>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-5 border-t border-indigo-50/50">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Fee</p>
                            <p className="text-2xl font-black text-indigo-600 tracking-tight">৳{s.price.toLocaleString()}</p>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100 group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-700">
                            <Plus size={24} strokeWidth={3.5} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="animate-fade-in-up pb-12">
                 <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-10 rounded-full bg-violet-600 shadow-lg shadow-violet-200" />
                    <h3 className="text-2xl font-black text-indigo-950 uppercase tracking-tight">Retail Boutique</h3>
                  </div>
                  <button className="flex items-center gap-2 group">
                    <span className="text-xs font-black text-violet-600 uppercase tracking-[0.2em]">View Shop</span>
                    <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                      <ChevronRight size={16} strokeWidth={3} />
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="group bg-white rounded-[2.5rem] border border-white p-4 shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-2xl hover:shadow-violet-100 hover:-translate-y-3 transition-all duration-700 cursor-pointer flex flex-col items-start relative overflow-hidden"
                    >
                      <div className="aspect-[5/4] w-full rounded-[2rem] bg-[#F8F9FF] flex items-center justify-center p-6 mb-4 overflow-hidden shadow-inner">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="max-h-full max-w-full object-contain group-hover:scale-125 transition-transform duration-1000 mix-blend-multiply"
                        />
                      </div>
                      <div className="px-1 w-full flex-1 flex flex-col">
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] mb-1.5">SKU: {p.id.toUpperCase()}</span>
                        <h3 className="font-black text-xs text-indigo-950 line-clamp-1 mb-4 uppercase tracking-wider leading-tight">{p.name}</h3>
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 w-full">
                          <p className="font-black text-lg text-indigo-600 tabular-nums">৳{p.price.toLocaleString()}</p>
                          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-all duration-500 shadow-sm active:scale-90">
                            <Plus size={18} strokeWidth={3.5} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>

        {/* --- RIGHT ORDER PANEL --- */}
        <aside className="w-80 lg:w-[540px] flex-none bg-white border-l border-indigo-50 flex flex-col z-20 shadow-[-20px_0_50px_rgba(79,70,229,0.02)]">
          {/* Compact Cart Header */}
          <div className="p-3 px-6 border-b border-indigo-50/50 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-xs ring-1 ring-indigo-100">
                  <ShoppingCart size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-[13px] font-black tracking-tight text-indigo-950 uppercase">Basket</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">{orderSeq}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={onClearCart}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300 active:scale-90 shadow-xs"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-6 p-6 pt-4">

            {/* Compact Cart Items List */}
            <div className="space-y-3">
              {cart.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="relative inline-block">
                     <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-indigo-200">
                        <ShoppingCart size={36} className="text-slate-200" />
                     </div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mt-6">Empty Basket</p>
                </div>
              ) : cart.map((item, idx) => (
                <div key={item.id} className="group relative flex items-center gap-4 p-3 rounded-3xl bg-white border border-indigo-50 shadow-sm hover:shadow-md transition-all duration-500 border-l-4 border-l-indigo-600/0 hover:border-l-indigo-600 animate-fade-in-up">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-50 flex-none shadow-xs">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-black text-indigo-950 truncate leading-tight uppercase tracking-tight leading-tight">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                       {item.type === "service" && (
                          <button
                            onClick={() => { setSelectedCartIdx(idx); setStaffOpen(true); }}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-xs"
                          >
                            <User size={8} strokeWidth={3} />
                            <span className="text-[7px] font-black uppercase tracking-widest truncate max-w-[60px]">{item.stylistName || "Staff"}</span>
                          </button>
                       )}
                       <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{item.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center bg-slate-50 rounded-xl p-0.5 border border-slate-100 shadow-inner scale-90">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-lg flex items-center justify-center text-indigo-600 hover:bg-white transition-all active:scale-75">
                          <Minus size={12} strokeWidth={3.5} />
                        </button>
                        <span className="w-6 text-center text-[10px] font-black text-indigo-950 tabular-nums">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-lg flex items-center justify-center text-indigo-600 hover:bg-white transition-all active:scale-75">
                          <Plus size={12} strokeWidth={3.5} />
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <p className="text-sm font-black text-indigo-900 tabular-nums">৳{(item.price * item.qty).toLocaleString()}</p>
                      </div>

                      <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-200 hover:text-rose-500 transition-all hover:bg-rose-50 active:scale-75 bg-white shadow-xs border border-slate-50">
                        <X size={14} strokeWidth={3.5} />
                      </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Compact Stylish Add-ons Panel */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4 bg-gradient-to-br from-indigo-600 to-violet-50 p-4 rounded-[1.75rem] text-white shadow-xl shadow-indigo-100 group cursor-pointer hover:shadow-indigo-200 transition-all duration-500">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform duration-700">
                    <Sparkles size={18} strokeWidth={2.5} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black leading-tight tracking-tight uppercase">Add-ons</h4>
                  </div>
                </div>
                <ChevronRight size={18} strokeWidth={3} className="text-white group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="space-y-2.5 px-0.5">
                {DEMO_ADDONS.map((ao) => {
                  const isSelected = selectedAddOnIds.includes(ao.id);
                  return (
                    <div
                      key={ao.id}
                      onClick={() => toggleAddOn(ao.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-[1.5rem] transition-all duration-500 cursor-pointer border-2 group/ao",
                        isSelected
                          ? "bg-white border-indigo-600 shadow-lg scale-[1.01]"
                          : "bg-white border-transparent hover:border-indigo-50 hover:bg-slate-50/50"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-500",
                        isSelected ? "bg-indigo-600 border-indigo-600 shadow-md" : "border-slate-100 bg-slate-50"
                      )}>
                        {isSelected && <CheckCircle2 size={12} strokeWidth={3.5} className="text-white" />}
                      </div>
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-none shadow-xs">
                        <img src={ao.image} alt={ao.name} className="w-full h-full object-cover group-hover/ao:scale-125 transition-transform duration-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tight">{ao.name}</p>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{ao.duration}</p>
                      </div>
                      <span className="text-[12px] font-black text-indigo-600 tabular-nums">+৳{ao.price}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Efficient Order Summary Footnote */}
          <div className="flex-none p-6 bg-white border-t border-indigo-50 space-y-5 z-20">
            <div className="space-y-3">
               {/* Mode Badge Bar */}
               <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAppointment(!isAppointment)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      isAppointment ? "bg-indigo-600 text-white shadow-md" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    <Monitor size={12} strokeWidth={2.5} /> {isAppointment ? "Reserved" : "Direct"}
                  </button>
                  {selectedCustomer && (
                    <button
                      onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                        useLoyaltyPoints ? "bg-emerald-600 text-white shadow-md" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      )}
                    >
                      <Gift size={12} strokeWidth={2.5} /> Use Pts
                    </button>
                  )}
               </div>

              <div className="space-y-2 px-0.5">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-indigo-950 tabular-nums">৳{baseSubtotal.toLocaleString()}</span>
                </div>
                {selectedAddOnIds.length > 0 && (
                  <div className="flex justify-between text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                    <span>Add-ons</span>
                    <span className="tabular-nums">+৳{addonsTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>V.A.Tax (15%)</span>
                  <span className="text-indigo-950 tabular-nums">৳{tax.toFixed(0)}</span>
                </div>
              </div>

              {/* Financial Inputs Strip - More space efficient */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-indigo-50/50">
                 <div className="space-y-1.5">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">Tips</span>
                    <div className="relative group">
                       <DollarSign size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" />
                       <input
                          type="number"
                          value={tipInput}
                          onChange={(e) => setTipInput(e.target.value)}
                          placeholder="Amount..."
                          className="w-full h-8 pl-8 pr-3 rounded-xl bg-slate-50/50 border border-transparent text-[10px] font-black text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all placeholder:text-slate-300 shadow-inner"
                       />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] font-black text-rose-300 uppercase tracking-widest">Discount</span>
                        <div className="flex items-center gap-1.5">
                           <button onClick={() => setDiscountType("flat")} className={cn("text-[8px] font-black", discountType === "flat" ? "text-indigo-600" : "text-slate-300")}>৳</button>
                           <button onClick={() => setDiscountType("percent")} className={cn("text-[8px] font-black", discountType === "percent" ? "text-indigo-600" : "text-slate-300")}>%</button>
                        </div>
                    </div>
                    <div className="relative group">
                       <X size={12} onClick={() => setDiscountInput("")} className={cn("absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 cursor-pointer hover:text-rose-500 z-10", !discountInput && "hidden")} />
                       <input
                          type="number"
                          value={discountInput}
                          onChange={(e) => setDiscountInput(e.target.value)}
                          placeholder="Value..."
                          className="w-full h-8 px-3 pr-8 rounded-xl bg-slate-50/50 border border-transparent text-[10px] font-black text-slate-700 outline-none focus:bg-white focus:border-rose-300 transition-all placeholder:text-slate-300 shadow-inner"
                       />
                    </div>
                 </div>
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-y border-dashed border-indigo-100">
              <span className="text-sm font-black text-indigo-950 uppercase tracking-widest">Total Amount</span>
              <span className="text-[34px] font-black text-indigo-600 tabular-nums leading-none tracking-tighter drop-shadow-lg">৳{total.toFixed(0)}</span>
            </div>

            <button
              onClick={() => setCheckoutOpen(true)}
              disabled={cart.length === 0 || submitting}
              className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-4 group disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <CreditCard size={20} strokeWidth={2.5} />
              </div>
              <span className="uppercase tracking-widest text-xs">Finalize Session</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </aside>
      </div>

      {/* Luxury Bottom Toolbar */}
      <footer className="flex-none h-[80px] bg-white/80 backdrop-blur-2xl border-t border-indigo-50 flex items-center justify-between px-10 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-12">
          <button onClick={() => setCustomerOpen(true)} className="flex items-center gap-4 group transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm group-active:scale-90 group-hover:-translate-y-1 duration-500 ring-4 ring-indigo-50/50">
              <UserPlus size={22} strokeWidth={2.5} />
            </div>
            <div className="text-left leading-tight">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-1">Active Client</p>
              <p className="text-sm font-black text-indigo-950 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{selectedCustomer?.name || "Walk-in Session"}</p>
            </div>
          </button>

          <div className="w-px h-10 bg-indigo-100/50" />

          <button onClick={() => { setSelectedCartIdx(null); setStaffOpen(true); }} className="flex items-center gap-4 group transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm group-active:scale-90 group-hover:-translate-y-1 duration-500 ring-4 ring-emerald-50/50">
              <Sparkles size={22} strokeWidth={2.5} />
            </div>
            <div className="text-left leading-tight">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-1">Assigned Stylist</p>
              <p className="text-sm font-black text-emerald-600 uppercase tracking-tight group-hover:text-emerald-700 transition-colors">{selectedGlobalStylist?.name || "Ready for Pickup"}</p>
            </div>
          </button>

          <div className="w-px h-10 bg-indigo-100/50 hidden lg:block" />

          <div className="flex items-center gap-3 bg-slate-50/50 p-1.5 rounded-[1.5rem] border border-indigo-50/50">
            {[
              { label: "Hold", icon: PauseCircle, onClick: holdOrder, color: "text-amber-500", bg: "bg-amber-50" },
              { label: "Recall", icon: History, onClick: () => setHeldOrdersOpen(true), color: "text-emerald-500", bg: "bg-emerald-50" },
              { label: "History", icon: History, onClick: () => setHistoryOpen(true), color: "text-blue-500", bg: "bg-blue-50" },
              { label: "Report", icon: TrendingUp, onClick: () => window.open("/reports", "_blank"), color: "text-indigo-500", bg: "bg-indigo-50" },
              { label: "Settings", icon: Settings, onClick: () => window.open("/settings", "_blank"), color: "text-slate-500", bg: "bg-slate-100" },
            ].map((tool) => (
              <button
                key={tool.label}
                onClick={tool.onClick}
                className={cn(
                  "flex items-center gap-3 px-6 py-2.5 rounded-2xl font-black transition-all duration-500 hover:scale-105 active:scale-95 group shadow-sm",
                  tool.color, tool.bg, "hover:bg-white ring-1 ring-transparent hover:ring-indigo-100"
                )}
              >
                <tool.icon size={16} strokeWidth={3} className="group-hover:rotate-12 transition-transform duration-700" />
                <span className="text-[10px] uppercase tracking-[0.2em] hidden xl:block">{tool.label}</span>
                {tool.label === "Recall" && heldOrders.length > 0 && (
                  <span className="ml-1 bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">{heldOrders.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setNotesOpen(true)} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-500 group relative active:scale-95 shadow-sm ring-1 ring-indigo-100">
            <Bell size={18} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform duration-700" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em]">Notes</span>
          </button>
          <button className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all duration-500 group relative active:scale-95 shadow-sm ring-1 ring-rose-100">
            <Gift size={18} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform duration-700" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em]">Rewards</span>
          </button>
        </div>
      </footer>

      {/* --- MODALS --- */}

      {/* Staff Selection */}
      <CustomModal open={isStaffOpen} onClose={() => setStaffOpen(false)} title="Assign Luxury Specialist" size="md">
        <div className="grid grid-cols-2 gap-6 p-2">
          {staffList.map(s => (
            <button
              key={s.id}
              onClick={() => assignStaff(s)}
              className="flex items-center gap-5 p-6 rounded-[2.5rem] border-2 border-slate-50 bg-white hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-500 group shadow-sm hover:shadow-2xl hover:shadow-indigo-100"
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-600 to-violet-500 text-white flex items-center justify-center text-xl font-black uppercase shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-transform">{s.name.charAt(0)}</div>
              <div className="text-left">
                <p className="text-base font-black text-slate-800 uppercase tracking-tight">{s.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{s.role}</p>
              </div>
            </button>
          ))}
        </div>
      </CustomModal>

      {/* Customer Management */}
      <CustomModal open={isCustomerOpen} onClose={() => setCustomerOpen(false)} title="Client Relationship Hub" size="md">
        <div className="space-y-8 p-2">
          <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-[2rem]">
            <button
              onClick={() => setCustomerModalTab("view")}
              className={cn("flex-1 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500", customerModalTab === "view" ? "bg-white text-indigo-600 shadow-md ring-1 ring-indigo-50" : "text-slate-500 hover:text-indigo-600")}
            >
              Find Client
            </button>
            <button
              onClick={() => setCustomerModalTab("add")}
              className={cn("flex-1 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500", customerModalTab === "add" ? "bg-white text-indigo-600 shadow-md ring-1 ring-indigo-50" : "text-slate-500 hover:text-indigo-600")}
            >
              New Profile
            </button>
          </div>

          {customerModalTab === "view" ? (
            <div className="space-y-6 animate-fade-in-up">
              <CustomInput
                placeholder="Search by full name or active phone..."
                leftIcon={<Search size={18} className="text-indigo-400" />}
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="!h-14 !rounded-[1.5rem] !text-base"
              />
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2 no-scrollbar">
                {filteredCustomers.length === 0 ? (
                  <div className="py-20 text-center opacity-40">
                     <User size={48} className="mx-auto mb-4 text-slate-300" />
                     <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">No Match Found</p>
                  </div>
                ) : filteredCustomers.map((c, idx) => (
                  <button
                    key={c.id || c._id || `cust-${idx}`}
                    onClick={() => { setCustomerId(c.id || c._id); setCustomerOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between p-5 rounded-[2rem] border transition-all duration-500 shadow-sm",
                      customerId === (c.id || c._id) ? "bg-indigo-50 border-indigo-300 shadow-indigo-100" : "bg-white border-slate-50 hover:border-indigo-100 hover:shadow-xl"
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg uppercase border-2 border-white shadow-md">{c.name.charAt(0)}</div>
                      <div className="text-left">
                        <p className="text-base font-black text-slate-800 uppercase tracking-tight">{c.name}</p>
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">{c.phone || "Privacy Shielded"}</p>
                      </div>
                    </div>
                    {customerId === (c.id || c._id) ? <CheckCircle2 size={24} strokeWidth={3.5} className="text-indigo-600" /> : <ChevronRight size={20} className="text-slate-200" />}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-2 gap-5">
                <CustomInput label="Full Name" placeholder="First Last..." value={newCustomer.name} onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))} className="!h-12 !rounded-2xl" />
                <CustomInput label="Direct Line" placeholder="01XXX-XXXXXX" value={newCustomer.phone} onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))} className="!h-12 !rounded-2xl" />
              </div>
              <CustomInput label="Digital Email" placeholder="client@luxury.com" value={newCustomer.email} onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))} className="!h-12 !rounded-2xl" />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] px-1">Residency Address</label>
                <textarea
                  placeholder="Street details, Landmark, City..."
                  className="w-full h-28 p-5 rounded-[1.75rem] bg-slate-50 border border-transparent text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-50 transition-all resize-none shadow-inner"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <CustomButton fullWidth themeColor="indigo" size="lg" onClick={handleAddCustomer} loading={submitting} className="!h-16 !rounded-[1.75rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-100 mt-4">Create Membership</CustomButton>
            </div>
          )}
        </div>
      </CustomModal>

      {/* Checkout Interface */}
      <CustomModal open={isCheckoutOpen} onClose={() => setCheckoutOpen(false)} title="Luxury Settle & Finalize" size="xl" className="!rounded-[2.5rem] !overflow-hidden">
        <div className="-mx-6 -mt-5 flex flex-col">
          {/* ── TOTAL DUE STRIP ── */}
          <div className="flex items-center justify-between gap-4 p-7 border-b border-indigo-50 bg-indigo-50/30">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Total Due</p>
              <p className="text-[38px] font-black tabular-nums text-indigo-600 leading-none tracking-tighter">
                ৳{total.toFixed(0)}
              </p>
            </div>
            <div className="text-[10px] font-black space-y-1 text-right shrink-0 text-slate-400 uppercase tracking-widest">
              <div className="flex justify-between gap-6">
                <span>Subtotal</span>
                <span className="text-slate-600">৳{subtotal.toFixed(0)}</span>
              </div>
              {(discountValue + loyaltyValue) > 0 && (
                <div className="flex justify-between gap-6">
                  <span>Benefit</span>
                  <span className="text-emerald-500">−৳{(discountValue + loyaltyValue).toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between gap-6">
                <span>VAT (15%)</span>
                <span className="text-slate-600">৳{tax.toFixed(0)}</span>
              </div>
              {tipValue > 0 && (
                <div className="flex justify-between gap-6">
                  <span>Tip</span>
                  <span className="text-indigo-500">+৳{tipValue.toFixed(0)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="px-8 py-6 space-y-6 max-h-[50vh] overflow-y-auto no-scrollbar bg-white">
            {/* PAYMENT METHODS */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 text-center">Authorization Method</p>
              <div className="grid grid-cols-5 gap-3">
                {CHECKOUT_METHODS.map((m) => {
                  const active = checkoutPayMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCheckoutPayMethod(m.id)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 py-4 text-center transition-all duration-500",
                        active
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-lg scale-[1.03]"
                          : "border-slate-50 bg-white text-slate-400 hover:border-indigo-100 hover:bg-indigo-50/30 hover:text-indigo-600"
                      )}
                    >
                      <div className={cn("transition-transform duration-500", active ? "scale-110" : "")}>{m.icon}</div>
                      <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CASH TENDERING */}
            {checkoutPayMethod === "CASH" && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Received</p>
                  <button
                    type="button"
                    onClick={() => setCashTenderedInput(total.toString())}
                    className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                  >
                    Exact Amount
                  </button>
                </div>

                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-indigo-200">৳</span>
                  <input
                    autoFocus
                    type="number"
                    value={cashTenderedInput}
                    onChange={(e) => setCashTenderedInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-16 rounded-2xl border-2 border-slate-50 bg-slate-50/50 pl-12 pr-6 text-[28px] font-black text-right tabular-nums focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all duration-500 shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {CASH_DENOMINATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(cashTenderedInput) || 0;
                        setCashTenderedInput((cur + d).toString());
                      }}
                      className="rounded-xl border-2 border-slate-50 py-2.5 text-[11px] font-black text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600 transition-all duration-300"
                    >
                      +৳{d >= 1000 ? `${d / 1000}k` : d}
                    </button>
                  ))}
                </div>

                {/* Change */}
                {(parseFloat(cashTenderedInput) || 0) > total && (
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-100 animate-bounce-in">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Change</span>
                    <span className="text-2xl font-black text-emerald-600 tabular-nums">৳{(parseFloat(cashTenderedInput) - total).toFixed(0)}</span>
                  </div>
                )}
              </div>
            )}

            {/* PRINT TOGGLE */}
            <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-50 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Printer size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Print Receipt</p>
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Thermal printer</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrintReceipt(!printReceipt)}
                className={cn(
                  "relative w-10 h-5 rounded-full transition-all duration-500",
                  printReceipt ? "bg-indigo-600" : "bg-slate-200"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-500 shadow-sm",
                  printReceipt ? "left-5.5" : "left-0.5"
                )} />
              </button>
            </div>
          </div>

          {/* ── FOOTER ACTIONS ── */}
          <div className="px-8 pb-8 pt-2 bg-white rounded-b-[2.5rem]">
            <CustomButton
              fullWidth
              size="lg"
              themeColor="indigo"
              loading={submitting}
              disabled={checkoutPayMethod === "CASH" && (parseFloat(cashTenderedInput) || 0) < total}
              onClick={() => confirmSale(checkoutPayMethod)}
              className="!rounded-2xl !h-16 font-black uppercase tracking-[0.3em] text-base shadow-xl shadow-indigo-100 flex items-center justify-center group whitespace-nowrap"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} strokeWidth={3} className="group-hover:rotate-12 transition-transform duration-500 shrink-0" />
                <span>Finalize Session</span>
              </div>
            </CustomButton>
          </div>
        </div>
      </CustomModal>


      {/* Held Sessions */}
      <CustomModal open={isHeldOrdersOpen} onClose={() => setHeldOrdersOpen(false)} title="Suspended Sessions" size="md">
        <div className="space-y-4 p-2">
          {heldOrders.length === 0 ? (
            <div className="py-24 text-center opacity-30">
              <PauseCircle size={80} className="mx-auto mb-6 text-slate-300 animate-pulse" />
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Queue is Empty</p>
            </div>
          ) : (
            heldOrders.map((held, idx) => (
              <div key={held.id || `held-${idx}`} className="p-6 rounded-[2.5rem] border border-slate-50 bg-white hover:border-indigo-100 transition-all duration-700 shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 group-hover:rotate-12 transition-transform duration-700"><PauseCircle size={26} strokeWidth={2.5} /></div>
                   <div>
                    <p className="text-sm font-black text-indigo-950 uppercase tracking-tight mb-1">{held.id}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{held.time} • {held.items.length} sessions</p>
                   </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-lg font-black text-indigo-600 tabular-nums">৳{held.total.toFixed(0)}</span>
                  <button onClick={() => recallOrder(held)} className="px-6 py-3 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-90">Recall</button>
                </div>
              </div>
            ))
          )}
        </div>
      </CustomModal>

      {/* Session History */}
      <CustomModal open={isHistoryOpen} onClose={() => setHistoryOpen(false)} title="Order Vault" size="2xl">
        <div className="space-y-6 p-2">
          {salesHistory.length === 0 ? (
            <div className="py-28 text-center opacity-30">
              <History size={80} className="mx-auto mb-6 text-slate-300" />
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Vault is Empty</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-50 rounded-[3rem] shadow-xl shadow-indigo-100/10">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-50">
                  <tr>
                    <th className="px-8 py-5">Invoice ID</th>
                    <th className="px-8 py-5">Guest Profile</th>
                    <th className="px-8 py-5 text-right">Value</th>
                    <th className="px-8 py-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {salesHistory.map((sale, idx) => {
                    const invNo = sale.invoiceNo || (sale.saleId ? `INV-${sale.saleId.slice(0, 8).toUpperCase()}` : `INV-${(sale._id || "").slice(-8).toUpperCase()}`);
                    const custName = sale.customerName || sale.customer?.name || "Walk-in";
                    const amount = Number(sale.total || sale.grandTotal || sale.totalAmount || 0);

                    return (
                    <tr key={sale.id || sale._id || `sale-${idx}`} className="text-xs hover:bg-indigo-50/30 transition-all duration-500 group">
                      <td className="px-8 py-5 font-mono font-black text-indigo-600 tracking-[0.2em]">{invNo}</td>
                      <td className="px-8 py-5 font-black uppercase tracking-tight text-slate-700">{custName}</td>
                      <td className="px-8 py-5 text-right font-black text-indigo-600 tabular-nums text-sm">৳{amount.toFixed(0)}</td>
                      <td className="px-8 py-5 text-center">
                        <button 
                          onClick={() => {
                            setCompletedSale({
                              result: sale,
                              cart: sale.items || [],
                              payments: sale.payments || [{ method: "CASH", amount: amount }],
                              cashierName: sale.cashierName || sale.salesmanName || sale.salesman?.name || "Staff",
                              customerName: custName,
                            });
                          }}
                          className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 active:scale-75 shadow-sm"
                        >
                          <Printer size={16} strokeWidth={2.5} />
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
      </CustomModal>

      {/* Internal Notes */}
      <CustomModal open={isNotesOpen} onClose={() => setNotesOpen(false)} title="Order Directives" size="sm">
        <div className="space-y-6 p-2">
          <textarea
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder="Document special instructions, allergies, or stylistic requests..."
            className="w-full h-48 p-7 rounded-[2.5rem] bg-slate-50/50 border border-transparent text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-[12px] focus:ring-indigo-50/50 transition-all resize-none placeholder:text-slate-300 shadow-inner leading-relaxed"
          />
          <CustomButton fullWidth themeColor="indigo" onClick={() => setNotesOpen(false)} className="!rounded-[1.75rem] !h-16 font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-100">Save Directive</CustomButton>
        </div>
      </CustomModal>

      {/* Global Receipt */}
      {completedSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-500">
          <div className="w-full max-w-sm">
            <ReceiptModal 
              result={completedSale.result} 
              cart={completedSale.cart}
              payments={completedSale.payments}
              cashierName={completedSale.cashierName}
              customerName={completedSale.customerName}
              onNewSale={() => { 
                setCompletedSale(null); 
                if (result) {
                  setResult(null); 
                  onClearCart(); 
                }
              }} 
            />
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
    </>
  );
}
