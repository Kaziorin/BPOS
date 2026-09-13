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
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { CustomModal, CustomInput, CustomButton, CustomSelect } from "@/components/custom";
import { toast } from "react-toastify";
import { ReceiptModal } from "../../pos/ReceiptModal";
import type { SaleResult, PaymentLine } from "../../pos/pos-types";

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

interface CartItem extends SalonItem {
  qty: number;
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

const DEMO_SERVICES: SalonItem[] = [
  { id: "s1", name: "Hair Cut & Styling", category: "hair", price: 800, duration: "45 min", image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=400&auto=format&fit=crop", badge: "Popular", type: "service" },
  { id: "s2", name: "Facial Treatment", category: "facial", price: 1500, duration: "60 min", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=400&auto=format&fit=crop", badge: "Best Seller", type: "service" },
  { id: "s3", name: "Manicure", category: "nail", price: 700, duration: "30 min", image: "https://images.unsplash.com/photo-1604654894610-df490601f626?q=80&w=400&auto=format&fit=crop", type: "service" },
  { id: "s4", name: "Pedicure", category: "nail", price: 800, duration: "45 min", image: "https://images.unsplash.com/photo-1519415510236-855906a2082f?q=80&w=400&auto=format&fit=crop", type: "service" },
  { id: "s5", name: "Eyelash Extension", category: "makeup", price: 1200, duration: "60 min", image: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?q=80&w=400&auto=format&fit=crop", type: "service" },
  { id: "s6", name: "Body Massage", category: "massage", price: 1500, duration: "60 min", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=400&auto=format&fit=crop", type: "service" },
  { id: "s7", name: "Hair Color", category: "hair", price: 2000, duration: "90 min", image: "https://images.unsplash.com/photo-1620331311520-246422fd82f9?q=80&w=400&auto=format&fit=crop", type: "service" },
  { id: "s8", name: "Makeup Service", category: "makeup", price: 1800, duration: "75 min", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=400&auto=format&fit=crop", badge: "New", type: "service" },
];

const DEMO_PRODUCTS: SalonItem[] = [
  { id: "p1", name: "Keratin Shampoo", category: "products", price: 1200, duration: "250ml", image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=200&auto=format&fit=crop", type: "product" },
  { id: "p2", name: "Hair Mask", category: "products", price: 1000, duration: "100g", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=200&auto=format&fit=crop", type: "product" },
  { id: "p3", name: "Face Cream", category: "products", price: 1500, duration: "50ml", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200&auto=format&fit=crop", type: "product" },
  { id: "p4", name: "Nail Polish", category: "products", price: 650, duration: "15ml", image: "https://images.unsplash.com/photo-1634712282287-14ed57b9cc89?q=80&w=200&auto=format&fit=crop", type: "product" },
  { id: "p5", name: "Sunscreen SPF 50", category: "products", price: 1800, duration: "100ml", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=200&auto=format&fit=crop", type: "product" },
];

const DEMO_ADDONS: AddOn[] = [
  { id: "a1", name: "Hair Wash & Blow Dry", duration: "20 min", price: 300, image: "https://images.unsplash.com/photo-1560869713-7d0a29430039?q=80&w=100&auto=format&fit=crop" },
  { id: "a2", name: "Hair Serum Treatment", duration: "15 min", price: 400, image: "https://images.unsplash.com/photo-1527799822341-47100b3d746d?q=80&w=100&auto=format&fit=crop" },
  { id: "a3", name: "Nail Art Design", duration: "15 min", price: 300, image: "https://images.unsplash.com/photo-1604654894610-df490601f626?q=80&w=100&auto=format&fit=crop" },
  { id: "a4", name: "Premium Face Mask", duration: "15 min", price: 350, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=100&auto=format&fit=crop" },
];

export default function SalonPOSPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal States
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [isHeldOrdersOpen, setHeldOrdersOpen] = useState(false);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [isCustomerOpen, setCustomerOpen] = useState(false);
  const [isNotesOpen, setNotesOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SaleResult | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [orderSeq] = useState(() => `ORD-${Math.floor(Math.random() * 9000) + 1000}`);

  // Load Customers
  useEffect(() => {
    api.get("/customers").then((res: any) => {
      setCustomers(res?.data?.data || res?.data || []);
    }).catch(() => {});
  }, []);

  // --- Computed ---
  const filteredServices = useMemo(() => {
    return DEMO_SERVICES.filter(s => {
      const matchesCat = activeCategory === "all" || s.category === activeCategory;
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const filteredProducts = useMemo(() => {
    return DEMO_PRODUCTS.filter(p => {
      const matchesCat = activeCategory === "all" || activeCategory === "products";
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

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
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  // --- Handlers ---
  const addToCart = (item: SalonItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
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
        payments: [{ method: paymentMethod, amount: total }],
        subTotal: baseSubtotal + addonsTotal,
        taxTotal: tax,
        grandTotal: total,
        note: orderNote,
      };

      const res: any = await api.post("/api/v1/pos/confirm", payload);
      setResult(res?.data || res);
      setSalesHistory(prev => [{ ...res?.data, customerName: selectedCustomer?.name || "Walk-in" }, ...prev]);
      onClearCart();
      setCheckoutOpen(false);
      toast.success("Sale confirmed!");
    } catch (err: any) {
      toast.error(err.message || "Failed to process sale");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCustomer = useMemo(() => customers.find(c => c.id === customerId), [customers, customerId]);

  return (
    <>
    <div className="h-screen w-screen flex flex-col bg-[#F3F4FF] overflow-hidden text-slate-800" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
      
      {/* --- TOP HEADER --- */}
      <header className="flex-none h-16 px-6 flex items-center justify-between gap-6 bg-white/40 backdrop-blur-md border-b border-white/20 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 rotate-3">
            <Smile size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none text-indigo-950">Glow & Style</h1>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Beauty Salon & Spa</p>
          </div>
        </div>

        <div className="flex-1 max-w-lg relative group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service or product..."
            className="w-full h-11 rounded-2xl bg-white border border-transparent px-11 text-sm font-medium focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all outline-none shadow-sm"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Calendar size={18} />
            </div>
            <div className="text-right leading-none">
              <p className="text-xs font-black text-slate-900">20 May, 2025</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Tue, 10:30 AM</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
              <User size={20} className="text-slate-500" />
            </div>
            <div className="hidden sm:block leading-none">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Cashier</p>
              <p className="text-xs font-black text-slate-900 mt-0.5">Rahat</p>
            </div>
          </div>

          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <Wifi size={18} />
          </div>

          <button
            onClick={() => setCustomerOpen(true)}
            className="flex items-center gap-3 pl-4 pr-3 py-2 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all group"
          >
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
              <User size={14} />
            </div>
            <span className="text-xs font-black">{selectedCustomer?.name || "Walk-in"}</span>
            <ChevronLeft size={16} className="rotate-270 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 relative">
        {/* --- LEFT NAVIGATION --- */}
        <aside className="w-24 lg:w-40 flex-none flex flex-col gap-2 p-3 bg-white/40 border-r border-white/20 z-20">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-300 group",
                  active
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 -translate-y-1 active:translate-y-0"
                    : "text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-md"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  active ? "bg-white/20" : "bg-slate-100 group-hover:bg-indigo-50"
                )}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? "text-white" : "text-slate-500 group-hover:text-indigo-600"} />
                </div>
                <span className="text-[10px] font-black text-center leading-tight">{cat.label}</span>
              </button>
            );
          })}
        </aside>

        {/* --- CENTER AREA --- */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Section Header */}
          <div className="flex-none p-6 pb-2 flex items-center justify-between">
            <h2 className="text-2xl font-black text-indigo-950 tracking-tight flex items-center gap-3 uppercase">
              <span className="w-2 h-8 rounded-full bg-indigo-600" />
              {CATEGORIES.find(c => c.id === activeCategory)?.label || "Services"}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">View Mode:</span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn("p-1.5 rounded-lg transition-all", viewMode === "grid" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-50")}
                >
                  <LayoutGrid size={14} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn("p-1.5 rounded-lg transition-all", viewMode === "list" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-50")}
                >
                  <List size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 py-6 space-y-10">
            {/* --- Popular Services Section --- */}
            {(activeCategory === "all" || activeCategory !== "products") && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Popular Services</h3>
                  <button className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group uppercase tracking-widest">
                    View All <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6"
                    : "space-y-4"
                )}>
                  {filteredServices.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => addToCart(s)}
                      className={cn(
                        "group relative bg-white rounded-[2.5rem] border border-white p-4 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-2xl hover:shadow-indigo-200/40 hover:-translate-y-2 transition-all duration-500 cursor-pointer flex",
                        viewMode === "grid" ? "flex-col" : "flex-row items-center gap-6"
                      )}
                    >
                      <div className={cn(
                        "relative rounded-[2rem] overflow-hidden bg-slate-100 shrink-0",
                        viewMode === "grid" ? "aspect-[4/3] w-full mb-4" : "h-24 w-32"
                      )}>
                        <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        {s.badge && viewMode === "grid" && (
                          <div className={cn(
                            "absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black text-white shadow-lg",
                            s.badge === "Popular" ? "bg-indigo-600" : s.badge === "Best Seller" ? "bg-rose-500" : "bg-emerald-500"
                          )}>
                            {s.badge}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-sm text-slate-800 truncate mb-1 uppercase tracking-tight">{s.name}</h3>
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold mb-4 uppercase">
                          <Clock size={12} strokeWidth={2.5} /> {s.duration}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-black text-indigo-950">৳ {s.price.toLocaleString()}</p>
                          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-all">
                            <Plus size={20} strokeWidth={3} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* --- Featured Products Section --- */}
            {(activeCategory === "all" || activeCategory === "products") && (
              <section className="pb-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Featured Products</h3>
                  <button className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group uppercase tracking-widest">
                    View All <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="group bg-white rounded-[2rem] border border-white p-4 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
                    >
                      <div className="aspect-square w-full rounded-2xl bg-[#F8F9FF] flex items-center justify-center p-4 mb-4">
                        <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h3 className="font-black text-[11px] text-slate-700 line-clamp-1 mb-2 uppercase tracking-tight">{p.name}</h3>
                      <div className="mt-auto w-full flex items-center justify-between pt-2 border-t border-slate-50">
                        <p className="font-black text-sm text-indigo-950">৳ {p.price.toLocaleString()}</p>
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <Plus size={16} strokeWidth={3} />
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
        <aside className="w-80 lg:w-[420px] flex-none bg-white border-l border-indigo-100/50 flex flex-col p-5 lg:p-6 z-20 shadow-[-10px_0_30px_rgba(79,70,229,0.02)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-indigo-950">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                <ShoppingCart size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight uppercase">Current Order</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No. {orderSeq}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={holdOrder} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all group">
                <PauseCircle size={14} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Hold</span>
              </button>
              <button onClick={onClearCart} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all group">
                <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Clear</span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-8 pr-1">
            <div className="space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
                    <ShoppingCart size={40} className="text-slate-300" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Cart is empty</p>
                  <p className="text-[10px] text-slate-300 mt-2 uppercase font-medium">Select a service to begin</p>
                </div>
              ) : cart.map((item) => (
                <div key={item.id} className="flex gap-4 p-3 rounded-[2rem] bg-white border border-slate-50 shadow-sm hover:shadow-md transition-all group animate-fade-in-up">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-none">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-[13px] font-black text-indigo-950 truncate leading-tight uppercase tracking-tight">{item.name}</h4>
                      <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors bg-white shadow-sm border border-slate-50">
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.duration}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center bg-slate-50 rounded-xl p-0.5 border border-slate-100">
                        <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-indigo-600 hover:bg-white hover:shadow-sm transition-all active:scale-90">
                          <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="w-8 text-center text-sm font-black text-indigo-950">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-indigo-600 hover:bg-white hover:shadow-sm transition-all active:scale-90">
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
                      <span className="text-[15px] font-black text-indigo-900 tabular-nums">৳{(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-4 bg-gradient-to-br from-indigo-600 to-violet-50 p-4 rounded-[2rem] text-white shadow-xl shadow-indigo-200 group cursor-pointer hover:shadow-2xl transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                    <Sparkles size={20} strokeWidth={2.5} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black leading-tight">Stylish Add-ons</h4>
                    <p className="text-[10px] font-bold text-indigo-100/70 uppercase tracking-widest mt-0.5">Enhance your service</p>
                  </div>
                </div>
                <ChevronLeft size={18} className="rotate-180 text-white group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="space-y-3">
                {DEMO_ADDONS.map((ao) => {
                  const isSelected = selectedAddOnIds.includes(ao.id);
                  return (
                    <div
                      key={ao.id}
                      onClick={() => toggleAddOn(ao.id)}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-[1.5rem] transition-all cursor-pointer border-2",
                        isSelected
                          ? "bg-white border-indigo-500 shadow-xl shadow-indigo-100 scale-[1.02]"
                          : "bg-white border-transparent hover:border-slate-100 hover:shadow-md"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                        isSelected ? "bg-indigo-600 border-indigo-600 shadow-lg" : "border-slate-200 bg-white"
                      )}>
                        {isSelected && <CheckCircle2 size={14} strokeWidth={3} className="text-white" />}
                      </div>
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 flex-none shadow-sm">
                        <img src={ao.image} alt={ao.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-black text-slate-800 leading-tight truncate uppercase tracking-tight">{ao.name}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-0.5">{ao.duration}</p>
                      </div>
                      <span className="text-[13px] font-black text-indigo-600 tabular-nums">+ ৳{ao.price}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex-none pt-6 border-t border-slate-100 bg-white space-y-5">
            <div className="space-y-2.5">
              <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-slate-800 tracking-tight font-black tabular-nums text-sm">৳{baseSubtotal.toLocaleString()}</span>
              </div>
              {selectedAddOnIds.length > 0 && (
                <div className="flex justify-between text-[11px] font-black text-emerald-500 uppercase tracking-widest">
                  <span>Add-ons ({selectedAddOnIds.length})</span>
                  <span className="font-black tracking-tight tabular-nums text-sm">+ ৳{addonsTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <span>Service Tax (5%)</span>
                <span className="text-slate-800 tracking-tight font-black tabular-nums text-sm">৳{tax.toFixed(0)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-lg font-black text-indigo-950 uppercase tracking-widest">Total</span>
              <span className="text-[42px] font-black text-indigo-600 tabular-nums leading-none tracking-tighter drop-shadow-sm">৳{total.toFixed(0)}</span>
            </div>
            <button
              onClick={() => setCheckoutOpen(true)}
              disabled={cart.length === 0 || submitting}
              className="w-full h-16 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-4 group disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
            >
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
                <CreditCard size={22} strokeWidth={2.5} />
              </div>
              <span className="uppercase tracking-[0.2em] text-base">Proceed to Payment</span>
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </aside>
      </div>

      {/* Modals */}
      <CustomModal open={isCheckoutOpen} onClose={() => setCheckoutOpen(false)} title="Checkout & Payment" size="md">
        <div className="space-y-6 p-2">
          <div className="p-5 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center justify-between shadow-inner">
            <span className="text-sm font-black text-indigo-900 uppercase tracking-widest">Total Amount</span>
            <span className="text-3xl font-black text-indigo-600 tabular-nums">৳ {total.toFixed(0)}</span>
          </div>
          <div className="space-y-4">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Select Payment Method</p>
            <div className="grid grid-cols-3 gap-4">
              {["CASH", "CARD", "MOBILE"].map(m => (
                <button
                  key={m}
                  onClick={() => confirmSale(m)}
                  disabled={submitting}
                  className="flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 border-slate-50 hover:border-indigo-500 hover:bg-indigo-50 transition-all group shadow-sm active:scale-95"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-white transition-all shadow-sm">
                    {m === "CASH" ? <DollarSign size={24} strokeWidth={2.5} className="text-indigo-600" /> : m === "CARD" ? <CreditCard size={24} strokeWidth={2.5} className="text-indigo-600" /> : <Monitor size={24} strokeWidth={2.5} className="text-indigo-600" />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{m}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4">
            <CustomButton fullWidth size="lg" themeColor="indigo" loading={submitting} onClick={() => confirmSale("CASH")} className="!rounded-[1.5rem] !h-14 font-black uppercase tracking-widest">Complete Sale</CustomButton>
          </div>
        </div>
      </CustomModal>

      <CustomModal open={isCustomerOpen} onClose={() => setCustomerOpen(false)} title="Select Customer" size="md">
        <div className="space-y-4">
          <CustomInput placeholder="Search by name or phone..." leftIcon={<Search size={16} />} />
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 no-scrollbar">
            {customers.map(c => (
              <button
                key={c.id}
                onClick={() => { setCustomerId(c.id); setCustomerOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-[1.5rem] border transition-all",
                  customerId === c.id ? "bg-indigo-50 border-indigo-200 shadow-sm" : "bg-white border-slate-100 hover:border-indigo-100"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black uppercase border border-white shadow-sm">{c.name.charAt(0)}</div>
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{c.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{c.phone || "No phone"}</p>
                  </div>
                </div>
                {customerId === c.id && <CheckCircle2 size={20} strokeWidth={3} className="text-indigo-600" />}
              </button>
            ))}
          </div>
        </div>
      </CustomModal>

      <CustomModal open={isHeldOrdersOpen} onClose={() => setHeldOrdersOpen(false)} title="Held Orders" size="md">
        <div className="space-y-3">
          {heldOrders.length === 0 ? (
            <div className="py-16 text-center opacity-30">
              <PauseCircle size={64} className="mx-auto mb-4 text-slate-300" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">No held orders</p>
            </div>
          ) : (
            heldOrders.map(held => (
              <div key={held.id} className="p-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-black text-indigo-950 uppercase tracking-tight">{held.id}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black">{held.time} • {held.items.length} items</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-indigo-600 tabular-nums">৳{held.total.toFixed(0)}</span>
                  <button onClick={() => recallOrder(held)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">Recall</button>
                </div>
              </div>
            ))
          )}
        </div>
      </CustomModal>

      <CustomModal open={isHistoryOpen} onClose={() => setHistoryOpen(false)} title="Sales History" size="lg">
        <div className="space-y-4">
          {salesHistory.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <History size={64} className="mx-auto mb-4 text-slate-300" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">No sales history yet</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-slate-100 rounded-[1.5rem] shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Invoice</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {salesHistory.map(sale => (
                    <tr key={sale.id} className="text-xs hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-black text-indigo-600 tracking-widest">{sale.invoiceNo}</td>
                      <td className="px-6 py-4 font-black uppercase tracking-tight text-slate-700">{sale.customerName}</td>
                      <td className="px-6 py-4 text-right font-black text-indigo-600 tabular-nums text-sm">৳{sale.total.toFixed(0)}</td>
                      <td className="px-6 py-4 text-center">
                        <button className="p-2.5 hover:bg-indigo-50 rounded-xl text-indigo-600 transition-all active:scale-90">
                          <Printer size={16} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CustomModal>

      <CustomModal open={isNotesOpen} onClose={() => setNotesOpen(false)} title="Order Notes" size="sm">
        <div className="space-y-5">
          <textarea
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder="Add special instructions for this order..."
            className="w-full h-40 p-5 rounded-[1.5rem] bg-slate-50 border-none text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 outline-none resize-none placeholder:text-slate-300 transition-all shadow-inner"
          />
          <CustomButton fullWidth themeColor="indigo" onClick={() => setNotesOpen(false)} className="!rounded-2xl !h-12 font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Save Note</CustomButton>
        </div>
      </CustomModal>

      {result && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm"><ReceiptModal result={result} onNewSale={() => setResult(null)} /></div>
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer className="flex-none h-16 bg-white border-t border-slate-100 flex items-center justify-between px-6 z-30">
        <div className="flex items-center gap-8">
          <button onClick={() => setCustomerOpen(true)} className="flex items-center gap-3 group transition-all">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-sm group-active:scale-95 group-hover:-translate-y-0.5">
              <User size={18} strokeWidth={2.5} />
            </div>
            <div className="text-left leading-none">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Customer</p>
              <p className="text-xs font-black text-slate-800 mt-1 uppercase tracking-tight">{selectedCustomer?.name || "Walk-in Client"}</p>
            </div>
          </button>
          <div className="h-8 w-px bg-slate-100" />
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
            {[
              { label: "Hold", icon: PauseCircle, onClick: () => setHeldOrdersOpen(true), color: "text-amber-500", bg: "bg-amber-50" },
              { label: "History", icon: History, onClick: () => setHistoryOpen(true), color: "text-blue-500", bg: "bg-blue-50" },
              { label: "Report", icon: TrendingUp, onClick: () => window.open("/reports", "_blank"), color: "text-emerald-500", bg: "bg-emerald-50" },
              { label: "Settings", icon: Settings, onClick: () => window.open("/settings", "_blank"), color: "text-slate-500", bg: "bg-slate-50" },
            ].map((tool) => (
              <button key={tool.label} onClick={tool.onClick} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl font-black transition-all hover:scale-105 active:scale-95 group shadow-xs", tool.color, tool.bg)}>
                <tool.icon size={15} strokeWidth={3} className="group-hover:rotate-12 transition-transform" />
                <span className="text-[9px] uppercase tracking-widest hidden lg:block">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setNotesOpen(true)} className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all group relative active:scale-95 shadow-sm">
            <Bell size={18} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Notes</span>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 border-2 border-white text-white text-[9px] font-black flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">3</div>
          </button>
          <button className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all group relative active:scale-95 shadow-sm">
            <Gift size={18} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Loyalty Points</span>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 border-2 border-white text-white text-[9px] font-black flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">2</div>
          </button>
        </div>
      </footer>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
    </>
  );
}
