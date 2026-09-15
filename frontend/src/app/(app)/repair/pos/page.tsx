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
  Maximize,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { toast } from "react-toastify";
import { CustomModal, CustomInput, CustomButton } from "@/components/custom";

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
  const [isCustomerOpen, setCustomerOpen] = useState(false);
  const [customerModalTab, setCustomerModalTab] = useState<"view" | "add">("view");
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", address: "" });
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
        const pData = ((partsRes as any).value.data as any)?.data ?? ((partsRes as any).value.data as any) ?? [];
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
        const cData = ((cusRes as any).value.data as any)?.data ?? ((cusRes as any).value.data as any) ?? [];
        setCustomers(Array.isArray(cData) ? cData : []);
      }

      if (techRes.status === "fulfilled") {
        const tData = ((techRes as any).value.data as any) ?? [];
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

  // Fullscreen shortcut
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.error(e));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    if (!newCustomer.name.trim()) return;
    setSavingCustomer(true);
    try {
      const res = await api.post("/customers", newCustomer);
      const created = ((res as any).data as any)?.data ?? ((res as any).data as any);
      if (created?.id) {
        setCustomers((prev) => [created, ...prev]);
        setCustomerId(created.id);
        setCustomerSearch(created.name);
        setCustomerOpen(false);
        setNewCustomer({ name: "", phone: "", email: "", address: "" });
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

      const ticketData = ((ticketRes as any).data as any)?.data ?? ((ticketRes as any).data as any);
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

      // Step 3: Fast-track ticket through lifecycle to DELIVERED (finalizes sale + stock deduction)
      const statuses = ["INSPECTION", "ESTIMATE", "APPROVED", "REPAIRING", "QUALITY_CHECK", "READY", "DELIVERED"];
      let deliverData = null;
      for (const st of statuses) {
        const payload: any = { status: st };
        if (st === "DELIVERED") payload.paymentMethod = paymentMethod;
        const sRes = await api.post(`/v1/repair/tickets/${ticketId}/status`, payload);
        if (st === "DELIVERED") {
           deliverData = ((sRes as any).data as any)?.data ?? ((sRes as any).data as any);
        }
      }
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

        .mesh-bg {
          background: linear-gradient(-45deg, #e0e7ff, #f8fafc, #ede9fe, #f1f5f9);
          background-size: 400% 400%;
          animation: gradientBg 15s ease infinite;
        }
        @keyframes gradientBg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .btn-sweep {
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .btn-sweep::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transform: skewX(-20deg);
          animation: sweep 3s infinite;
        }
        @keyframes sweep {
          0% { left: -100%; }
          20% { left: 200%; }
          100% { left: 200%; }
        }

        .glass-panel {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
        }

        .field-input {
          width: 100%;
          border-radius: 12px;
          border: 1.5px solid rgba(226, 232, 240, 0.8);
          background: rgba(255, 255, 255, 0.8);
          padding: 8px 12px;
          font-size: 13px;
          color: #0f172a;
          outline: none;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .field-input:focus {
          border-color: #8b5cf6;
          background: #ffffff;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.01), 0 0 0 4px rgba(139, 92, 246, 0.15);
        }
        .field-input::placeholder { color: #94a3b8; }
        
        .card-3d {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .card-3d:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 20px 40px -15px rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.3);
        }
      `}</style>

      <div className="repair-pos h-screen w-screen flex flex-col mesh-bg select-none overflow-hidden">

        {/* ── TOP NAV BAR ───────────────────────────────────────────────── */}
        <header className="flex-none flex items-center justify-between px-5 py-3 mx-3 mt-3 rounded-3xl glass-panel z-20">
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
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition ml-1"
              title="Toggle Fullscreen (F)"
            >
              <Maximize size={15} />
            </button>
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
            <div className="flex-none grid grid-cols-4 gap-3">
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

            {/* Tab Bar */}
            <div className="flex-none flex items-center p-1 rounded-2xl glass-panel shadow-sm">
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
              <div className="flex-1 min-h-0 glass-panel rounded-3xl p-4 flex flex-col">
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
                  partsViewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3 content-start" : "space-y-2"
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
                        className="group card-3d flex items-center p-3 rounded-2xl bg-gradient-to-r from-white/80 to-white/50 backdrop-blur-xl border border-white hover:bg-white hover:shadow-[0_12px_40px_-10px_rgba(99,102,241,0.2)] cursor-pointer transition-all duration-300 relative overflow-hidden"
                        onClick={() => addPart(part)}
                      >
                        {/* Hover Glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-indigo-50/0 to-indigo-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        {/* Premium Icon Block */}
                        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 z-10">
                          <Package size={20} className="drop-shadow-sm" />
                        </div>
                        
                        {/* Content Area */}
                        <div className="ml-4 flex-1 min-w-0 z-10">
                          <div className="flex justify-between items-start mb-1.5">
                             <p className="text-[14px] font-black text-slate-800 truncate group-hover:text-indigo-700 transition-colors">{part.name}</p>
                             <span className="text-[15px] font-black text-indigo-700 ml-4 flex-shrink-0 group-hover:scale-105 transition-transform origin-right">{fmt(part.sellingPrice)}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                             <span className="text-[10px] text-slate-500 font-mono bg-white/80 px-2 py-0.5 rounded-md border border-slate-200/60 shadow-sm">{part.sku}</span>
                             {part.categoryName && (
                               <span className="text-[10px] text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md font-bold shadow-sm">{part.categoryName}</span>
                             )}
                             {part.stockQty !== undefined && (
                                <span className={cn(
                                  "text-[10px] rounded-md px-2 py-0.5 font-extrabold flex items-center gap-1.5 shadow-sm", 
                                  part.stockQty > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100/50" : "bg-red-50 text-red-700 border border-red-100/50"
                                )}>
                                  <span className={cn("w-1.5 h-1.5 rounded-full shadow-sm", part.stockQty > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                                  {part.stockQty > 0 ? `${part.stockQty} in stock` : "Out of stock"}
                                </span>
                             )}
                          </div>
                        </div>

                        {/* Add Button Action Area */}
                        <div className="ml-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0 z-10">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 group-active:scale-95 transition-all">
                            <Plus size={20} strokeWidth={3} />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    filteredParts.map((part) => (
                      <div
                        key={part.id}
                        className="group card-3d w-full text-left p-3 rounded-2xl bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-xl border border-white hover:bg-white hover:shadow-[0_8px_30px_-10px_rgba(99,102,241,0.2)] cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col gap-2"
                        onClick={() => addPart(part)}
                      >
                        {/* Hover Background Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-indigo-50/0 to-indigo-100/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        <div className="flex items-center justify-between z-10 relative">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                            <Package size={14} className="drop-shadow-sm" />
                          </div>
                          
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                             <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/40">
                                <Plus size={14} strokeWidth={3} />
                             </div>
                          </div>
                        </div>

                        <div className="z-10 relative">
                          <p className="text-xs font-black text-slate-800 leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">{part.name}</p>
                          <div className="flex items-end justify-between mt-1.5">
                             {part.stockQty !== undefined && (
                                <span className={cn(
                                  "text-[9px] rounded-md px-1.5 py-0.5 font-extrabold flex items-center gap-1 shadow-sm", 
                                  part.stockQty > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100/50" : "bg-red-50 text-red-700 border border-red-100/50"
                                )}>
                                  <span className={cn("w-1 h-1 rounded-full shadow-sm", part.stockQty > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                                  {part.stockQty > 0 ? part.stockQty : "Out"}
                                </span>
                             )}
                             <p className="text-sm font-black text-indigo-700">{fmt(part.sellingPrice)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Labor Panel */}
            {activeTab === "labor" && (
              <div className="flex-1 flex flex-col gap-3 min-h-0">
                <div className="flex-none glass-panel rounded-3xl p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-200">
                      <Hammer size={15} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800">Add Labor / Service Line</h3>
                      <p className="text-[10px] text-slate-400">E.g. IC Reballing, Water Wash, Screen Calibration</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 xl:col-span-6">
                      <label className="field-label">Service / Labor Description</label>
                      <input
                        ref={laborNameRef}
                        type="text"
                        className="field-input"
                        placeholder="e.g. Screen Replacement Labor..."
                        value={laborName}
                        onChange={(e) => setLaborName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addLabor()}
                      />
                    </div>
                    <div className="col-span-6 xl:col-span-3">
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
                    <div className="col-span-6 xl:col-span-3">
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
                <div className="flex-1 min-h-0 glass-panel rounded-3xl p-4 flex flex-col">
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
                          className="group text-left p-3 rounded-xl bg-white/60 border border-white/60 card-3d flex flex-col gap-2 relative overflow-hidden"
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
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-0 glass-panel rounded-3xl overflow-hidden shadow-lg">

            {/* Customer selector */}
            <div className="flex-none p-4 border-b border-slate-50">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={12} className="text-indigo-500" /> Customer
                </p>
                <button
                  onClick={() => { setCustomerModalTab("view"); setCustomerOpen(true); }}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded-md"
                >
                  <UserPlus size={11} /> Select / Add
                </button>
              </div>

              <div className="relative">
                {selectedCustomer && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200 cursor-pointer" onClick={() => { setCustomerModalTab("view"); setCustomerOpen(true); }}>
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
                      onClick={(e) => { e.stopPropagation(); setCustomerId(""); setCustomerSearch(""); }}
                      className="text-indigo-300 hover:text-indigo-500 p-1 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Device Info */}
            <div className="flex-none p-4 border-b border-white/40 bg-white/20 space-y-3">
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
                <input
                  type="text"
                  className="field-input"
                  placeholder="Describe the device problem and findings..."
                  value={diagnosisProblem}
                  onChange={(e) => setDiagnosisProblem(e.target.value)}
                />
              </div>
            </div>

            {/* Cart / Job Ticket */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white/10">
              <div className="flex-none px-4 py-3 border-b border-white/40 flex items-center justify-between">
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
            <div className="flex-none p-4 bg-white/30 border-t border-white/40 space-y-3">
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
                className="btn-glow btn-sweep w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold text-sm shadow-[0_10px_25px_-5px_rgba(99,102,241,0.5)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all flex items-center justify-center gap-2.5"
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
        <footer className="flex-none flex items-center justify-between px-5 py-2 mx-3 mb-3 rounded-full glass-panel z-20 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
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

      {/* ── CUSTOMER MODAL ──────────────────────────────────────────────── */}
      <CustomModal open={isCustomerOpen} onClose={() => setCustomerOpen(false)} title="Customer Management" size="md">
        <div className="space-y-8 p-2">
          <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-[2rem]">
            <button
              onClick={() => setCustomerModalTab("view")}
              className={cn("flex-1 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500", customerModalTab === "view" ? "bg-white text-indigo-600 shadow-md ring-1 ring-indigo-50" : "text-slate-500 hover:text-indigo-600")}
            >
              View Customer
            </button>
            <button
              onClick={() => setCustomerModalTab("add")}
              className={cn("flex-1 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500", customerModalTab === "add" ? "bg-white text-indigo-600 shadow-md ring-1 ring-indigo-50" : "text-slate-500 hover:text-indigo-600")}
            >
              Add Customer
            </button>
          </div>

          {customerModalTab === "view" ? (
            <div className="space-y-6 animate-fade-in-up">
              <CustomInput
                placeholder="Search by name or phone..."
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
                    key={c.id || `cust-${idx}`}
                    onClick={() => { setCustomerId(c.id); setCustomerOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between p-5 rounded-[2rem] border transition-all duration-500 shadow-sm",
                      customerId === c.id ? "bg-indigo-50 border-indigo-300 shadow-indigo-100" : "bg-white border-slate-50 hover:border-indigo-100 hover:shadow-xl"
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg uppercase border-2 border-white shadow-md">{c.name.charAt(0)}</div>
                      <div className="text-left">
                        <p className="text-base font-black text-slate-800 uppercase tracking-tight">{c.name}</p>
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">{c.phone || "No Phone"}</p>
                      </div>
                    </div>
                    {customerId === c.id ? <CheckCircle2 size={24} strokeWidth={3.5} className="text-indigo-600" /> : <ChevronRight size={20} className="text-slate-200" />}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-2 gap-5">
                <CustomInput label="Full Name" placeholder="John Doe" value={newCustomer.name} onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))} className="!h-12 !rounded-2xl" />
                <CustomInput label="Phone Number" placeholder="01XXX-XXXXXX" value={newCustomer.phone} onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))} className="!h-12 !rounded-2xl" />
              </div>
              <CustomInput label="Email" placeholder="client@example.com" value={newCustomer.email} onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))} className="!h-12 !rounded-2xl" />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] px-1">Address</label>
                <textarea
                  placeholder="Street details..."
                  className="w-full h-28 p-5 rounded-[1.75rem] bg-slate-50 border border-transparent text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-50 transition-all resize-none shadow-inner"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <CustomButton fullWidth themeColor="indigo" size="lg" onClick={saveNewCustomer} loading={savingCustomer} className="!h-16 !rounded-[1.75rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-100 mt-4">Save Customer</CustomButton>
            </div>
          )}
        </div>
      </CustomModal>

      {/* ── COMPLETED TICKET MODAL (Monochrome) ────────────────────────── */}
      {completedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-white p-6 text-center relative overflow-hidden border-b border-slate-100">
              <div className="absolute inset-0 opacity-40">
                <div className="absolute top-2 left-4 w-24 h-24 rounded-full bg-slate-50" />
                <div className="absolute -bottom-4 right-4 w-32 h-32 rounded-full bg-slate-50" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center mx-auto mb-3 shadow-lg shadow-black/10">
                  <CheckCircle2 size={26} className="text-white" />
                </div>
                <h2 className="text-lg font-black tracking-tight text-slate-900">Ticket Completed!</h2>
                <p className="text-slate-500 text-xs mt-1 font-medium">Device delivered & payment recorded</p>
                <div className="mt-4 bg-slate-50 rounded-xl px-4 py-2 inline-block border border-slate-200 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ticket No.</p>
                  <p className="text-base font-extrabold font-mono tracking-tight text-slate-800">{completedTicket.ticketNo}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Device / Customer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Device</p>
                  <p className="text-sm font-extrabold text-slate-800">{completedTicket.deviceModel}</p>
                  {completedTicket.imeiSerial && (
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{completedTicket.imeiSerial}</p>
                  )}
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Customer</p>
                  <p className="text-sm font-extrabold text-slate-800">{completedTicket.customerName}</p>
                  {completedTicket.customerPhone && (
                    <p className="text-[10px] text-slate-500 mt-0.5">{completedTicket.customerPhone}</p>
                  )}
                </div>
              </div>

              {completedTicket.diagnosisProblem && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Problem / Diagnosis</p>
                  <p className="text-xs text-slate-800 font-medium">{completedTicket.diagnosisProblem}</p>
                </div>
              )}

              {/* Line Items */}
              <div>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-2">Work Done</p>
                <div className="space-y-2">
                  {completedTicket.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-wider rounded-md px-1.5 py-0.5",
                            item.type === "PART" ? "bg-black text-white" : "bg-slate-200 text-slate-700"
                          )}>
                            {item.type}
                          </span>
                          <p className="text-xs font-bold text-slate-800">{item.name}</p>
                        </div>
                        {item.warrantyMonths > 0 && (
                          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                            <ShieldCheck size={10} /> {item.warrantyMonths} month warranty
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-black text-slate-800 tabular-nums">{fmt(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Parts Total</span>
                  <span className="font-bold text-slate-700 tabular-nums">{fmt(completedTicket.partsTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Labor Total</span>
                  <span className="font-bold text-slate-700 tabular-nums">{fmt(completedTicket.laborTotal)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-200">
                  <span className="text-sm font-extrabold text-slate-800">Total Paid</span>
                  <span className="text-2xl font-black text-black tabular-nums tracking-tight">{fmt(completedTicket.grandTotal)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</span>
                  <span className="text-[10px] font-black text-slate-700 bg-white rounded px-2 py-0.5 border border-slate-200 shadow-sm">{completedTicket.paymentMethod}</span>
                </div>
              </div>

              {completedTicket.invoiceNo && (
                <p className="text-center text-[11px] text-slate-400">
                  Invoice No: <span className="font-bold font-mono text-slate-700">{completedTicket.invoiceNo}</span>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 hover:text-black transition shadow-sm"
              >
                <Printer size={16} /> Print Job Card
              </button>
              <button
                onClick={() => setCompletedTicket(null)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-slate-800 transition shadow-lg shadow-black/20"
              >
                <Plus size={16} /> New Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
