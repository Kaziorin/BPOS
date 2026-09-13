"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Wrench,
  Search,
  Plus,
  Trash2,
  Receipt,
  Printer,
  ChevronLeft,
  Clock,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Cpu,
  Smartphone,
  HardDrive,
  User,
  X,
  CreditCard,
  Banknote,
  Zap,
  Package,
  Settings2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Star,
  LayoutGrid,
  List,
  Sparkles,
  Monitor,
  PhoneCall,
  FileText,
  TrendingUp,
  UserPlus,
  RefreshCcw,
  ShoppingBag,
  Tag,
  CheckSquare,
  Hammer,
  Activity,
  Award,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { toast } from "react-toastify";

// ── Types ─────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface SparePart {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  stockQty?: number;
  categoryName?: string;
}

interface RepairLineItem {
  id: string;
  type: "PART" | "LABOR" | "OTHER";
  productId?: string;
  name: string;
  qty: number;
  unitPrice: number;
  warrantyMonths: number;
  lineTotal: number;
}

interface CompletedTicket {
  ticketId: string;
  ticketNo: string;
  invoiceNo?: string;
  deviceModel: string;
  imeiSerial: string;
  customerName: string;
  customerPhone: string;
  diagnosisProblem: string;
  technicianName: string;
  items: RepairLineItem[];
  partsTotal: number;
  laborTotal: number;
  grandTotal: number;
  date: string;
  warrantyEligible?: boolean;
  paymentMethod: string;
}

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash", icon: Banknote },
  { id: "CARD", label: "Card", icon: CreditCard },
  { id: "MOBILE", label: "Mobile", icon: Smartphone },
  { id: "BANK", label: "Bank Transfer", icon: TrendingUp },
];

const PRIORITIES = [
  { id: "LOW", label: "Low", color: "text-slate-500 bg-slate-100" },
  { id: "MEDIUM", label: "Medium", color: "text-amber-600 bg-amber-50" },
  { id: "HIGH", label: "High", color: "text-orange-600 bg-orange-50" },
  { id: "URGENT", label: "Urgent", color: "text-red-600 bg-red-50" },
];

// ── Main Component ─────────────────────────────────────────────────────────

export default function RepairPOSPage() {
  // Data state
  const [parts, setParts] = useState<SparePart[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [loadingParts, setLoadingParts] = useState(true);

  // Ticket form state
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [deviceModel, setDeviceModel] = useState("");
  const [imeiSerial, setImeiSerial] = useState("");
  const [diagnosisProblem, setDiagnosisProblem] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "MOBILE" | "BANK">("CASH");
  const [notes, setNotes] = useState("");

  // Cart
  const [cart, setCart] = useState<RepairLineItem[]>([]);

  // Labor adder
  const [laborName, setLaborName] = useState("");
  const [laborPrice, setLaborPrice] = useState("");
  const [laborWarranty, setLaborWarranty] = useState("1");

  // Search
  const [searchFilter, setSearchFilter] = useState("");
  const [partsViewMode, setPartsViewMode] = useState<"grid" | "list">("list");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [completedTicket, setCompletedTicket] = useState<CompletedTicket | null>(null);
  const [activeTab, setActiveTab] = useState<"parts" | "labor">("parts");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCust, setNewCust] = useState({ name: "", phone: "", email: "" });
  const [savingCustomer, setSavingCustomer] = useState(false);

  const customerSearchRef = useRef<HTMLInputElement>(null);
  const laborNameRef = useRef<HTMLInputElement>(null);

  // ── Load Data ────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoadingParts(true);
    try {
      const [partsRes, cusRes, techRes] = await Promise.allSettled([
        api.get("/products?limit=300&status=ACTIVE"),
        api.get("/customers?limit=200"),
        api.get("/v1/salon/staff"),
      ]);

      if (partsRes.status === "fulfilled") {
        const pData = (partsRes.value.data as any)?.data ?? (partsRes.value.data as any) ?? [];
        setParts(
          Array.isArray(pData)
            ? pData.map((p: any) => ({
                id: p.id,
                name: p.name,
                sku: p.sku || "PART",
                sellingPrice: Number(p.sellingPrice || 0),
                stockQty: Number(p.totalStock ?? p._count?.stockRows ?? 0),
                categoryName: p.category?.name || p.categoryName || "",
              }))
            : []
        );
      }

      if (cusRes.status === "fulfilled") {
        const cData = (cusRes.value.data as any)?.data ?? (cusRes.value.data as any) ?? [];
        setCustomers(Array.isArray(cData) ? cData : []);
      }

      if (techRes.status === "fulfilled") {
        const tData = (techRes.value.data as any) ?? [];
        setTechnicians(
          Array.isArray(tData)
            ? tData.map((t: any) => ({ id: t.id, name: t.name }))
            : []
        );
      }
    } catch (e) {
      console.error("Load error", e);
    } finally {
      setLoadingParts(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Computed ─────────────────────────────────────────────────────────
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  );

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customers.slice(0, 20);
    return customers
      .filter((c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)))
      .slice(0, 10);
  }, [customers, customerSearch]);

  const filteredParts = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return parts;
    return parts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q))
    );
  }, [parts, searchFilter]);

  const partsTotal = cart.filter((i) => i.type === "PART").reduce((acc, i) => acc + i.lineTotal, 0);
  const laborTotal = cart.filter((i) => i.type !== "PART").reduce((acc, i) => acc + i.lineTotal, 0);
  const grandTotal = partsTotal + laborTotal;

  const selectedTechnician = useMemo(
    () => technicians.find((t) => t.id === technicianId),
    [technicians, technicianId]
  );

  const selectedPriority = useMemo(
    () => PRIORITIES.find((p) => p.id === priority) ?? PRIORITIES[1],
    [priority]
  );

  // ── Handlers ──────────────────────────────────────────────────────────

  const fmt = (n: number) =>
    `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const addPart = (part: SparePart) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === part.id && i.type === "PART");
      if (existing) {
        return prev.map((i) =>
          i.productId === part.id && i.type === "PART"
            ? { ...i, qty: i.qty + 1, lineTotal: (i.qty + 1) * i.unitPrice }
            : i
        );
      }
      return [
        ...prev,
        {
          id: `part-${part.id}-${Date.now()}`,
          type: "PART",
          productId: part.id,
          name: part.name,
          qty: 1,
          unitPrice: part.sellingPrice,
          warrantyMonths: 3,
          lineTotal: part.sellingPrice,
        },
      ];
    });
    toast.success(`${part.name} added`, { autoClose: 1200, position: "bottom-right" });
  };

  const addLabor = () => {
    if (!laborName.trim() || !laborPrice) return;
    const price = parseFloat(laborPrice) || 0;
    const months = parseInt(laborWarranty) || 1;
    setCart((prev) => [
      ...prev,
      {
        id: `labor-${Date.now()}`,
        type: "LABOR",
        name: laborName.trim(),
        qty: 1,
        unitPrice: price,
        warrantyMonths: months,
        lineTotal: price,
      },
    ]);
    setLaborName("");
    setLaborPrice("");
    setLaborWarranty("1");
    laborNameRef.current?.focus();
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty, lineTotal: newQty * i.unitPrice };
      })
    );
  };

  const removeLine = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));

  const saveNewCustomer = async () => {
    if (!newCust.name.trim()) return;
    setSavingCustomer(true);
    try {
      const res = await api.post("/customers", newCust);
      const created = (res.data as any)?.data ?? (res.data as any);
      if (created?.id) {
        setCustomers((prev) => [created, ...prev]);
        setCustomerId(created.id);
        setCustomerSearch(created.name);
        setShowNewCustomer(false);
        setNewCust({ name: "", phone: "", email: "" });
        toast.success("Customer created!");
      }
    } catch {
      toast.error("Failed to create customer");
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleCompleteTicket = async () => {
    if (!customerId) { toast.error("Please select a customer"); return; }
    if (!deviceModel.trim()) { toast.error("Please enter device model"); return; }
    if (cart.length === 0) { toast.error("Add at least one part or labor item"); return; }

    setSubmitting(true);
    try {
      // Step 1: Create the repair ticket
      const ticketRes = await api.post("/v1/repair/tickets", {
        customerId,
        deviceInfo: deviceModel,
        serialNo: imeiSerial || undefined,
        reportedProblem: diagnosisProblem || undefined,
        technicianId: technicianId || undefined,
        priority,
        notes: notes || undefined,
      });

      const ticketData = (ticketRes.data as any);
      const ticketId = ticketData?.id;

      if (!ticketId) throw new Error("Failed to create ticket");

      // Step 2: Add all line items
      for (const item of cart) {
        await api.post(`/v1/repair/tickets/${ticketId}/items`, {
          lineType: item.type,
          productId: item.productId || undefined,
          name: item.name,
          qty: item.qty,
          unitPrice: item.unitPrice,
        });
      }

      // Step 3: Move ticket to DELIVERED (finalizes sale + stock deduction)
      const deliverRes = await api.post(`/v1/repair/tickets/${ticketId}/status`, {
        status: "DELIVERED",
        paymentMethod,
      });

      const deliverData = (deliverRes.data as any);
      const custName = selectedCustomer?.name || "Customer";
      const techName = selectedTechnician?.name || "Technician";

      setCompletedTicket({
        ticketId,
        ticketNo: ticketData?.ticketNo || `TKT-${Date.now().toString().slice(-6)}`,
        invoiceNo: deliverData?.sale?.invoiceNo,
        deviceModel,
        imeiSerial,
        customerName: custName,
        customerPhone: selectedCustomer?.phone || "",
        diagnosisProblem,
        technicianName: techName,
        items: cart,
        partsTotal,
        laborTotal,
        grandTotal,
        date: new Date().toISOString(),
        warrantyEligible: ticketData?.warrantyEligible,
        paymentMethod,
      });

      // Reset form
      setCart([]);
      setCustomerId("");
      setCustomerSearch("");
      setDeviceModel("");
      setImeiSerial("");
      setDiagnosisProblem("");
      setNotes("");
      toast.success("Repair ticket completed & delivered!");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to complete ticket";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        .repair-pos * { font-family: 'Inter', sans-serif; }

        .card-3d {
          transform-style: preserve-3d;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .card-3d:hover {
          transform: translateY(-2px) rotateX(1deg);
          box-shadow: 0 20px 40px -12px rgba(79, 70, 229, 0.2);
        }

        .part-card {
          transition: all 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform: translateY(0px);
        }
        .part-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px -4px rgba(79, 70, 229, 0.18);
        }
        .part-card:active {
          transform: translateY(0px) scale(0.98);
        }

        .btn-glow {
          position: relative;
          overflow: hidden;
        }
        .btn-glow::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
          border-radius: inherit;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .btn-glow:hover::after { opacity: 1; }

        .shimmer {
          background: linear-gradient(90deg, #f0f4ff 25%, #e8efff 50%, #f0f4ff 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        .badge-pulse {
          animation: badgePulse 2s ease-in-out infinite;
        }
        @keyframes badgePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .cart-item-enter {
          animation: slideIn 0.25s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .stat-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }
        .stat-card:hover {
          border-color: #a5b4fc;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.1);
        }

        .priority-urgent { border-left: 3px solid #ef4444; }
        .priority-high { border-left: 3px solid #f97316; }
        .priority-medium { border-left: 3px solid #f59e0b; }
        .priority-low { border-left: 3px solid #94a3b8; }

        .tab-active {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .field-label {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }

        .field-input {
          width: 100%;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          padding: 8px 12px;
          font-size: 13px;
          color: #0f172a;
          outline: none;
          transition: all 0.15s;
        }
        .field-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }
        .field-input::placeholder { color: #94a3b8; }
      `}</style>

      <div className="repair-pos h-screen w-screen flex flex-col bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 select-none overflow-hidden">

        {/* ── TOP NAV BAR ───────────────────────────────────────────────── */}
        <header className="flex-none flex items-center justify-between px-5 py-3 mx-3 mt-3 rounded-3xl bg-gradient-to-r from-indigo-100/60 via-white/80 to-purple-100/60 backdrop-blur-md border border-white/80 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <Link
              href="/repair"
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all font-semibold text-xs"
            >
              <ChevronLeft size={15} /> Back
            </Link>

            <div className="w-px h-6 bg-slate-200" />

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
                <Wrench size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-slate-800 leading-tight">Repair & Service POS</h1>
                <p className="text-[10px] text-slate-400 font-medium">Device Diagnostics & Job Card Manager</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 ml-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live System</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Priority selector */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="text-xs font-bold rounded-xl border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:border-indigo-400 cursor-pointer"
            >
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>{p.label} Priority</option>
              ))}
            </select>

            {/* Technician selector */}
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:border-indigo-400 min-w-[160px] cursor-pointer"
            >
              <option value="">-- Select Technician --</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <button
              onClick={loadData}
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
              title="Refresh"
            >
              <RefreshCcw size={15} />
            </button>
          </div>
        </header>

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden">

          {/* LEFT PANEL – Parts/Labor catalog */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3 min-h-0">

            {/* Stats Row */}
            <div className="flex-none grid grid-cols-4 gap-2">
              {[
                { label: "Parts in Catalog", value: parts.length, icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Items in Ticket", value: cart.length, icon: ShoppingBag, color: "text-violet-600", bg: "bg-violet-50" },
                { label: "Parts Cost", value: fmt(partsTotal), icon: Tag, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Labor Charge", value: fmt(laborTotal), icon: Hammer, color: "text-emerald-600", bg: "bg-emerald-50" },
              ].map((stat) => (
                <div key={stat.label} className="stat-card rounded-2xl p-3 flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon size={16} className={stat.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-semibold truncate">{stat.label}</p>
                    <p className={`text-sm font-extrabold ${stat.color} truncate`}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs: Parts / Add Labor */}
            <div className="flex-none flex items-center gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100">
              {(["parts", "labor"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5",
                    activeTab === tab ? "tab-active" : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                  )}
                >
                  {tab === "parts" ? <><Package size={13} /> Spare Parts Catalog</> : <><Cpu size={13} /> Add Labor / Service</>}
                </button>
              ))}
            </div>

            {/* Parts Panel */}
            {activeTab === "parts" && (
              <div className="flex-1 min-h-0 flex flex-col gap-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Search + view toggle */}
                <div className="flex-none p-3 border-b border-slate-100 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Search parts by name, SKU or category..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition"
                    />
                    {searchFilter && (
                      <button onClick={() => setSearchFilter("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                    {(["list", "grid"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setPartsViewMode(mode)}
                        className={cn(
                          "p-1.5 rounded-lg transition",
                          partsViewMode === mode ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        {mode === "list" ? <List size={13} /> : <LayoutGrid size={13} />}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded-lg px-2 py-1 whitespace-nowrap">
                    {filteredParts.length} items
                  </span>
                </div>

                {/* Parts list */}
                <div className={cn(
                  "flex-1 min-h-0 overflow-y-auto p-3",
                  partsViewMode === "grid" ? "grid grid-cols-2 gap-2 content-start" : "space-y-1.5"
                )}>
                  {loadingParts ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-16 rounded-xl shimmer" />
                    ))
                  ) : filteredParts.length === 0 ? (
                    <div className="py-16 text-center col-span-2">
                      <Package size={40} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-sm font-bold text-slate-400">No parts found</p>
                      <p className="text-xs text-slate-300 mt-1">Try a different search term</p>
                    </div>
                  ) : partsViewMode === "list" ? (
                    filteredParts.map((part) => (
                      <div
                        key={part.id}
                        className="part-card group flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 cursor-pointer"
                        onClick={() => addPart(part)}
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:from-indigo-100 transition">
                          <HardDrive size={15} className="text-indigo-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{part.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono">{part.sku}</span>
                            {part.categoryName && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">{part.categoryName}</span>
                            )}
                            {part.stockQty !== undefined && (
                              <span className={cn(
                                "text-[10px] rounded px-1.5 py-0.5 font-semibold",
                                part.stockQty > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                              )}>
                                {part.stockQty > 0 ? `${part.stockQty} in stock` : "Out of stock"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-extrabold text-indigo-700">{fmt(part.sellingPrice)}</span>
                          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:scale-110">
                            <Plus size={13} />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    filteredParts.map((part) => (
                      <div
                        key={part.id}
                        className="part-card p-3 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 cursor-pointer flex flex-col gap-2"
                        onClick={() => addPart(part)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <HardDrive size={14} className="text-indigo-500" />
                          </div>
                          <Plus size={13} className="text-indigo-400" />
                        </div>
                        <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-2">{part.name}</p>
                        <p className="text-sm font-extrabold text-indigo-700">{fmt(part.sellingPrice)}</p>
                        {part.stockQty !== undefined && (
                          <span className={cn(
                            "text-[10px] rounded px-1.5 py-0.5 font-semibold self-start",
                            part.stockQty > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                          )}>
                            {part.stockQty > 0 ? `Stock: ${part.stockQty}` : "Out of stock"}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Labor Panel */}
            {activeTab === "labor" && (
              <div className="flex-1 flex flex-col gap-3 min-h-0">
                <div className="flex-none bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-200">
                      <Hammer size={15} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800">Add Labor / Service Line</h3>
                      <p className="text-[10px] text-slate-400">E.g. IC Reballing, Water Wash, Screen Calibration</p>
                    </div>
                  </div>

                  <div>
                    <label className="field-label">Service / Labor Description</label>
                    <input
                      ref={laborNameRef}
                      type="text"
                      className="field-input"
                      placeholder="e.g. Screen Replacement Labor, IC Chip Reballing..."
                      value={laborName}
                      onChange={(e) => setLaborName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addLabor()}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="field-label">Service Charge (৳)</label>
                      <input
                        type="number"
                        className="field-input"
                        placeholder="0.00"
                        value={laborPrice}
                        onChange={(e) => setLaborPrice(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addLabor()}
                      />
                    </div>
                    <div>
                      <label className="field-label">Warranty (Months)</label>
                      <select
                        value={laborWarranty}
                        onChange={(e) => setLaborWarranty(e.target.value)}
                        className="field-input cursor-pointer"
                      >
                        {[0, 1, 3, 6, 12].map((m) => (
                          <option key={m} value={m}>{m === 0 ? "No Warranty" : `${m} Month${m > 1 ? "s" : ""}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={addLabor}
                    disabled={!laborName.trim() || !laborPrice}
                    className="btn-glow w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-extrabold shadow-md shadow-amber-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:from-amber-400 hover:to-orange-400 flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Labor to Ticket
                  </button>
                </div>

                {/* Common labor presets */}
                <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col">
                  <div className="flex-none flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quick Labor Presets</p>
                    <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">Most Used</span>
                  </div>
                  
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-2 content-start pb-2">
                      {[
                        { name: "Screen Replace", price: 500, warranty: 3, icon: Smartphone, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
                        { name: "Battery Replace", price: 300, warranty: 3, icon: Zap, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
                        { name: "IC Reballing", price: 800, warranty: 1, icon: Cpu, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100" },
                        { name: "Water Wash", price: 400, warranty: 0, icon: Activity, color: "text-cyan-500", bg: "bg-cyan-50", border: "border-cyan-100" },
                        { name: "Charging Port", price: 350, warranty: 3, icon: Settings2, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
                        { name: "Software Flash", price: 250, warranty: 1, icon: Monitor, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100" },
                        { name: "Housing Change", price: 600, warranty: 0, icon: Hammer, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100" },
                        { name: "Diagnostic Fee", price: 200, warranty: 0, icon: Search, color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200" },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            setLaborName(preset.name);
                            setLaborPrice(String(preset.price));
                            setLaborWarranty(String(preset.warranty));
                            addLabor();
                            toast.info(`Added ${preset.name}`, { autoClose: 1000, position: "bottom-right" });
                          }}
                          className="group text-left p-3 rounded-xl bg-white border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col gap-2 relative overflow-hidden"
                        >
                          <div className="absolute -right-4 -top-4 w-12 h-12 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500" style={{ backgroundColor: "currentColor" }} />
                          <div className={`w-8 h-8 rounded-lg ${preset.bg} ${preset.border} border flex items-center justify-center`}>
                            <preset.icon size={14} className={preset.color} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700 leading-tight">{preset.name}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[11px] font-extrabold text-slate-900">{fmt(preset.price)}</p>
                              {preset.warranty > 0 && <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded">{preset.warranty}m</span>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL – Job Ticket Builder */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3 min-h-0">

            {/* Customer selector */}
            <div className="flex-none bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={12} className="text-indigo-500" /> Customer
                </p>
                <button
                  onClick={() => setShowNewCustomer((v) => !v)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <UserPlus size={11} /> New
                </button>
              </div>

              {showNewCustomer ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Full Name *"
                    value={newCust.name}
                    onChange={(e) => setNewCust((p) => ({ ...p, name: e.target.value }))}
                  />
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Phone Number"
                    value={newCust.phone}
                    onChange={(e) => setNewCust((p) => ({ ...p, phone: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveNewCustomer}
                      disabled={savingCustomer || !newCust.name.trim()}
                      className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-50 hover:bg-indigo-700 transition"
                    >
                      {savingCustomer ? "Saving..." : "Save & Select"}
                    </button>
                    <button
                      onClick={() => setShowNewCustomer(false)}
                      className="px-3 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold hover:bg-slate-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {selectedCustomer ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0">
                        {selectedCustomer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-indigo-900 truncate">{selectedCustomer.name}</p>
                        {selectedCustomer.phone && (
                          <p className="text-[11px] text-indigo-500 font-medium">{selectedCustomer.phone}</p>
                        )}
                      </div>
                      <button
                        onClick={() => { setCustomerId(""); setCustomerSearch(""); }}
                        className="text-indigo-300 hover:text-indigo-500 p-1 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          ref={customerSearchRef}
                          type="text"
                          className="field-input !pl-9"
                          placeholder="Search customer by name or phone..."
                          value={customerSearch}
                          onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                          onFocus={() => setShowCustomerDropdown(true)}
                        />
                      </div>
                      {showCustomerDropdown && (customerSearch.length > 0 || filteredCustomers.length > 0) && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setShowCustomerDropdown(false)} />
                          <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl max-h-52 overflow-y-auto">
                            {filteredCustomers.length === 0 ? (
                              <p className="text-xs text-slate-400 text-center py-4">No customers found</p>
                            ) : (
                            filteredCustomers.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setCustomerId(c.id);
                                  setCustomerSearch(c.name);
                                  setShowCustomerDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 transition text-xs border-b border-slate-50 last:border-0"
                              >
                                <p className="font-bold text-slate-800">{c.name}</p>
                                {c.phone && <p className="text-slate-400 text-[10px]">{c.phone}</p>}
                              </button>
                            ))
                          )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Device Info */}
            <div className="flex-none bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <p className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone size={12} className="text-indigo-500" /> Device Information
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="field-label">Device Model *</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="e.g. iPhone 15 Pro, Samsung S24..."
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">IMEI / Serial No.</label>
                  <input
                    type="text"
                    className="field-input font-mono"
                    placeholder="IMEI or Serial #"
                    value={imeiSerial}
                    onChange={(e) => setImeiSerial(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="field-label">Problem / Diagnosis</label>
                <textarea
                  className="field-input resize-none"
                  rows={2}
                  placeholder="Describe the device problem and findings..."
                  value={diagnosisProblem}
                  onChange={(e) => setDiagnosisProblem(e.target.value)}
                />
              </div>
            </div>

            {/* Cart / Job Ticket */}
            <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
              <div className="flex-none px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt size={14} className="text-indigo-500" />
                  <span className="text-xs font-extrabold text-slate-700">Job Ticket</span>
                  {cart.length > 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                      {cart.length}
                    </span>
                  )}
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[10px] font-bold text-red-400 hover:text-red-600 transition"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-3">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center mb-3 shadow-inner">
                      <Wrench size={28} className="text-slate-300" />
                    </div>
                    <p className="text-xs font-bold text-slate-400">No Items Added Yet</p>
                    <p className="text-[11px] text-slate-300 mt-1">Select parts from catalog or add labor charges</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.id} className={cn(
                        "cart-item-enter p-3 rounded-xl bg-slate-50 border border-slate-100",
                        item.type === "PART" ? "border-l-2 border-l-indigo-400" : "border-l-2 border-l-amber-400"
                      )}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={cn(
                                "text-[9px] font-extrabold rounded px-1.5 py-0.5 uppercase tracking-wider",
                                item.type === "PART" ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-700"
                              )}>
                                {item.type}
                              </span>
                              {item.warrantyMonths > 0 && (
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 rounded px-1.5 py-0.5 flex items-center gap-0.5">
                                  <ShieldCheck size={8} /> {item.warrantyMonths}m
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                          </div>
                          <button onClick={() => removeLine(item.id)} className="text-slate-300 hover:text-red-400 transition p-0.5 flex-shrink-0">
                            <X size={13} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => updateQty(item.id, -1)} className="w-5 h-5 rounded-md bg-slate-200 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition">
                              <span className="text-xs font-bold leading-none">−</span>
                            </button>
                            <span className="text-xs font-extrabold text-slate-700 w-5 text-center tabular-nums">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-5 h-5 rounded-md bg-slate-200 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition">
                              <span className="text-xs font-bold leading-none">+</span>
                            </button>
                            <span className="text-[10px] text-slate-400 ml-1">× {fmt(item.unitPrice)}</span>
                          </div>
                          <span className="text-sm font-extrabold text-indigo-700 tabular-nums">{fmt(item.lineTotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              {cart.length > 0 && (
                <div className="flex-none border-t border-slate-100 p-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Package size={11} /> Parts</span>
                    <span className="font-bold tabular-nums">{fmt(partsTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Hammer size={11} /> Labor</span>
                    <span className="font-bold tabular-nums">{fmt(laborTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
                    <span className="text-sm font-extrabold text-slate-700">Grand Total</span>
                    <span className="text-xl font-black text-indigo-700 tabular-nums">{fmt(grandTotal)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method + Complete */}
            <div className="flex-none bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <p className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard size={12} className="text-indigo-500" /> Payment Method
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id as any)}
                    className={cn(
                      "py-2.5 px-2 rounded-xl text-[10px] font-extrabold flex flex-col items-center gap-1 transition-all border",
                      paymentMethod === pm.id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                    )}
                  >
                    <pm.icon size={14} />
                    {pm.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCompleteTicket}
                disabled={cart.length === 0 || !customerId || !deviceModel.trim() || submitting}
                className="btn-glow w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold text-sm shadow-lg shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:from-indigo-500 hover:to-violet-500 flex items-center justify-center gap-2.5"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing...</>
                ) : cart.length === 0 ? (
                  <><AlertTriangle size={17} /> Add Items First</>
                ) : !customerId ? (
                  <><User size={17} /> Select a Customer</>
                ) : !deviceModel.trim() ? (
                  <><Smartphone size={17} /> Enter Device Model</>
                ) : (
                  <><CheckCircle2 size={17} /> Complete & Generate Job Card</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <footer className="flex-none flex items-center justify-between px-5 py-2 mx-3 mb-3 rounded-full bg-gradient-to-r from-purple-100/60 via-white/80 to-indigo-100/60 backdrop-blur-md border border-white/80 shadow-sm z-20 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> All Systems Operational
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Monitor size={12} className="text-indigo-400" /> BPOS Repair Engine</span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-400" /> Secured Connection</span>
          </div>
        </footer>
      </div>

      {/* ── COMPLETED TICKET MODAL ───────────────────────────────────────── */}
      {completedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-2 left-4 w-24 h-24 rounded-full bg-white/30" />
                <div className="absolute -bottom-4 right-4 w-32 h-32 rounded-full bg-white/20" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <CheckCircle2 size={28} className="text-white" />
                </div>
                <h2 className="text-lg font-extrabold">Ticket Completed!</h2>
                <p className="text-indigo-200 text-xs mt-1">Device delivered & payment recorded</p>
                <div className="mt-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 inline-block border border-white/30">
                  <p className="text-[10px] text-indigo-200 font-semibold">Ticket No.</p>
                  <p className="text-base font-extrabold font-mono">{completedTicket.ticketNo}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Device / Customer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Device</p>
                  <p className="text-sm font-extrabold text-slate-800">{completedTicket.deviceModel}</p>
                  {completedTicket.imeiSerial && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{completedTicket.imeiSerial}</p>
                  )}
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Customer</p>
                  <p className="text-sm font-extrabold text-slate-800">{completedTicket.customerName}</p>
                  {completedTicket.customerPhone && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{completedTicket.customerPhone}</p>
                  )}
                </div>
              </div>

              {completedTicket.diagnosisProblem && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Problem / Diagnosis</p>
                  <p className="text-xs text-amber-900 font-medium">{completedTicket.diagnosisProblem}</p>
                </div>
              )}

              {/* Line Items */}
              <div>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-2">Work Done</p>
                <div className="space-y-1.5">
                  {completedTicket.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "text-[9px] font-extrabold rounded px-1 py-0.5",
                            item.type === "PART" ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-700"
                          )}>
                            {item.type}
                          </span>
                          <p className="text-xs font-bold text-slate-800">{item.name}</p>
                        </div>
                        {item.warrantyMonths > 0 && (
                          <p className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-1">
                            <ShieldCheck size={9} /> {item.warrantyMonths} month warranty
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-extrabold text-slate-800 tabular-nums">{fmt(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Parts Total</span>
                  <span className="font-bold tabular-nums">{fmt(completedTicket.partsTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Labor Total</span>
                  <span className="font-bold tabular-nums">{fmt(completedTicket.laborTotal)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-indigo-200">
                  <span className="text-sm font-extrabold text-indigo-900">Total Paid</span>
                  <span className="text-2xl font-black text-indigo-700 tabular-nums">{fmt(completedTicket.grandTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">Payment Method</span>
                  <span className="text-[11px] font-bold text-slate-600 bg-white rounded-lg px-2 py-0.5 border border-slate-200">{completedTicket.paymentMethod}</span>
                </div>
              </div>

              {completedTicket.invoiceNo && (
                <p className="text-center text-xs text-slate-400">
                  Invoice: <span className="font-bold font-mono text-slate-600">{completedTicket.invoiceNo}</span>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
              >
                <Printer size={14} /> Print Job Card
              </button>
              <button
                onClick={() => setCompletedTicket(null)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold hover:from-indigo-500 hover:to-violet-500 transition shadow-md shadow-indigo-200"
              >
                <Plus size={14} /> New Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
