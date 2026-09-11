"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  ReceiptText,
  Search,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Mail,
  Stethoscope,
  Heart,
  RotateCcw,
  History,
  Archive,
  ChevronDown,
  LogOut,
  Settings,
  Bell,
  Shield,
  Package,
  Clock,
  TrendingUp,
  Minus,
  Plus,
  SlidersHorizontal,
  Filter,
  MapPin,
  Leaf,
  Printer,
  Sliders,
  Tv,
  Save,
  Info,
  CreditCard,
  ScanBarcode,
  CheckCheck,
  Trash2,
  Monitor,
  Loader2,
  RefreshCw,
  Calendar,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";
import type { RegisterProduct } from "@/lib/catalog";
import type { RxCartItem } from "./PharmacyPOSRightPanel";

// ═══════════════════════════════════════════
// TOAST NOTIFICATION
// ═══════════════════════════════════════════
interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export function PosToast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: "bg-emerald-600",
    error: "bg-rose-600",
    info: "bg-[#00796b]",
  };

  return (
    <div
      className={cn(
        "fixed bottom-14 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-2xl px-5 py-3 text-white shadow-xl text-[13px] font-bold animate-in slide-in-from-bottom-4 duration-300",
        colors[type],
      )}
    >
      <CheckCircle2 size={16} />
      {message}
    </div>
  );
}

// ═══════════════════════════════════════════
// SLIDE OVER WRAPPER
// ═══════════════════════════════════════════
interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  Icon?: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  children: React.ReactNode;
  width?: string;
}

export function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  Icon,
  iconColor = "text-[#00796b]",
  iconBg = "bg-[#e0f2f1]",
  children,
  width = "w-[480px]",
}: SlideOverProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          "relative ml-auto flex h-full flex-col bg-white shadow-2xl",
          width,
        )}
      >
        {/* Header */}
        <div className="flex flex-none items-center gap-3 border-b border-slate-200 px-5 py-4">
          {Icon && (
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconBg)}>
              <Icon size={18} className={iconColor} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-black text-slate-900">{title}</h2>
            {subtitle && <p className="text-[11px] font-medium text-slate-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={17} />
          </button>
        </div>
        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MODAL WRAPPER
// ═══════════════════════════════════════════
interface ModalWrapperProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  Icon?: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function ModalWrapper({
  open,
  onClose,
  title,
  subtitle,
  Icon,
  iconColor = "text-[#00796b]",
  iconBg = "bg-[#e0f2f1]",
  children,
  maxWidth = "max-w-md",
}: ModalWrapperProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative w-full rounded-2xl bg-white shadow-2xl overflow-hidden", maxWidth)}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          {Icon && (
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl shrink-0", iconBg)}>
              <Icon size={18} className={iconColor} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-black text-slate-900 leading-tight">{title}</h2>
            {subtitle && <p className="text-[11px] font-medium text-slate-400 leading-tight mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition shrink-0"
          >
            <X size={17} />
          </button>
        </div>
        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// SALES HISTORY PANEL (REAL API CONNECTED)
// ═══════════════════════════════════════════
interface ApiSaleItem {
  id?: string;
  name?: string;
  productName?: string;
  qty?: number;
  unitPrice?: number;
  lineTotal?: number;
  sku?: string;
}

interface ApiSale {
  id: string;
  invoiceNo?: string;
  total?: number;
  grandTotal?: number;
  paidTotal?: number;
  dueTotal?: number;
  status?: string;
  createdAt?: string;
  paymentMethod?: string;
  itemsCount?: number;
  customerName?: string;
  customerPhone?: string;
  customer?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
  };
  cashier?: {
    id?: string;
    name?: string;
  };
  items?: ApiSaleItem[];
}

interface SalesHistoryPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SalesHistoryPanel({ open, onClose }: SalesHistoryPanelProps) {
  const [sales, setSales] = useState<ApiSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewScope, setViewScope] = useState<"today" | "all">("today");
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  const fetchSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        limit: 100,
        sortBy: "createdAt",
        sortDir: "desc",
      };

      if (viewScope === "today") {
        const todayStr = new Date().toISOString().slice(0, 10);
        params.startDate = todayStr;
        params.endDate = todayStr;
      }

      const res: any = await api.get("/pos/sales", { params });
      const items: ApiSale[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : [];

      setSales(items);
    } catch (err: any) {
      console.error("Failed to load POS sales:", err);
      setError(err?.message || "Failed to load sales history from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSales();
    }
  }, [open, viewScope]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((s) => {
      const inv = (s.invoiceNo || s.id || "").toLowerCase();
      const cust = (s.customer?.name || s.customerName || "").toLowerCase();
      const phone = (s.customer?.phone || s.customerPhone || "").toLowerCase();
      const pm = (s.paymentMethod || "").toLowerCase();
      return inv.includes(q) || cust.includes(q) || phone.includes(q) || pm.includes(q);
    });
  }, [sales, search]);

  const totalRevenue = useMemo(() => {
    return filtered.reduce((acc, s) => {
      const st = (s.status || "").toLowerCase();
      if (st.includes("void") || st.includes("refund")) return acc;
      return acc + Number(s.total ?? s.grandTotal ?? 0);
    }, 0);
  }, [filtered]);

  const transactionsCount = filtered.length;
  const avgBill = transactionsCount > 0 ? totalRevenue / transactionsCount : 0;

  function formatTime(val?: string) {
    if (!val) return "";
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      const isToday = new Date().toDateString() === d.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
      }
      return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} · ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}`;
    } catch {
      return val;
    }
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Sales History"
      subtitle={viewScope === "today" ? "Today's transactions" : "Recent transactions"}
      Icon={History}
      width="w-[540px]"
    >
      <div className="flex flex-col h-full">
        {/* Scope Tabs & Refresh */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl">
            <button
              type="button"
              onClick={() => setViewScope("today")}
              className={cn(
                "px-3 py-1 text-[11px] font-bold rounded-lg transition",
                viewScope === "today"
                  ? "bg-white text-teal-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setViewScope("all")}
              className={cn(
                "px-3 py-1 text-[11px] font-bold rounded-lg transition",
                viewScope === "all"
                  ? "bg-white text-teal-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              All Recent
            </button>
          </div>
          <button
            type="button"
            onClick={fetchSales}
            disabled={loading}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-teal-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50"
            title="Refresh sales list"
          >
            <RefreshCw size={13} className={cn(loading && "animate-spin text-teal-600")} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3 border-b border-slate-100 px-5 py-3 bg-white">
          <div className="rounded-xl bg-emerald-50 p-3 text-center border border-emerald-100/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Sales</p>
            <p className="text-[18px] font-black text-emerald-600 tabular-nums">৳{totalRevenue.toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-sky-50 p-3 text-center border border-sky-100/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Transactions</p>
            <p className="text-[18px] font-black text-sky-600 tabular-nums">{transactionsCount}</p>
          </div>
          <div className="rounded-xl bg-purple-50 p-3 text-center border border-purple-100/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg. Bill</p>
            <p className="text-[18px] font-black text-purple-600 tabular-nums">
              ৳{avgBill.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-slate-100 px-5 py-2.5 bg-white">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice, customer, phone, payment..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-[12px] font-medium text-slate-800 placeholder-slate-400 focus:border-[#00897b] focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>

        {/* Sales List / States */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5">
          {loading && sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 size={28} className="animate-spin text-[#00897b] mb-2" />
              <p className="text-[12px] font-medium">Loading sales history...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-center">
              <AlertTriangle size={24} className="mx-auto text-rose-500 mb-1" />
              <p className="text-[12px] font-bold text-rose-700">{error}</p>
              <button
                type="button"
                onClick={fetchSales}
                className="mt-2 text-[11px] font-bold text-white bg-rose-600 px-3 py-1.5 rounded-xl hover:bg-rose-700 transition"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-2 text-slate-400">
                <ReceiptText size={24} />
              </div>
              <p className="text-[13px] font-extrabold text-slate-600">No transactions found</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                {viewScope === "today"
                  ? "No sales have been recorded yet today. Switch to 'All Recent' to view previous transactions."
                  : "No sales records match your search."}
              </p>
              {viewScope === "today" && (
                <button
                  type="button"
                  onClick={() => setViewScope("all")}
                  className="mt-3 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl hover:bg-teal-100 transition"
                >
                  View All Recent Sales
                </button>
              )}
            </div>
          ) : (
            filtered.map((sale) => {
              const invNo = sale.invoiceNo || sale.id;
              const custName = sale.customer?.name || sale.customerName || "Walk-in";
              const itemCount = sale.itemsCount ?? (Array.isArray(sale.items) ? sale.items.length : 0);
              const totalAmount = Number(sale.total ?? sale.grandTotal ?? 0);
              const due = Number(sale.dueTotal ?? 0);
              const status = (sale.status || (due > 0 ? "due" : "paid")).toLowerCase();
              const isExpanded = expandedSaleId === sale.id;

              return (
                <div
                  key={sale.id}
                  className={cn(
                    "rounded-2xl border transition overflow-hidden bg-white",
                    isExpanded
                      ? "border-teal-300 ring-2 ring-teal-50 shadow-sm"
                      : "border-slate-200/80 hover:border-teal-200 hover:shadow-xs"
                  )}
                >
                  <div
                    onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                    className="flex items-center gap-3 p-3 cursor-pointer select-none"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e0f2f1] text-[#00796b]">
                      <ReceiptText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[12.5px] font-black text-slate-800 tracking-tight">{invNo}</p>
                        {sale.paymentMethod && (
                          <span className="text-[9.5px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600">
                            {sale.paymentMethod}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                        {custName} · {itemCount} {itemCount === 1 ? "item" : "items"} · {formatTime(sale.createdAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <p className="text-[13px] font-black text-[#00796b] tabular-nums">৳{totalAmount.toFixed(2)}</p>
                        <span
                          className={cn(
                            "inline-block text-[9.5px] font-bold px-2 py-0.5 rounded-full capitalize",
                            status === "paid" || status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : status.includes("refund") || status.includes("void")
                              ? "bg-rose-100 text-rose-600"
                              : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {status}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={15} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={15} className="text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70 p-3 text-[11px] space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-slate-600 pb-2 border-b border-slate-200/60">
                        <div>
                          <span className="font-semibold text-slate-400">Cashier: </span>
                          <span className="font-bold text-slate-700">{sale.cashier?.name || "System"}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-400">Payment: </span>
                          <span className="font-bold text-slate-700">{sale.paymentMethod || "CASH"}</span>
                        </div>
                        {sale.customer?.phone && (
                          <div className="col-span-2">
                            <span className="font-semibold text-slate-400">Phone: </span>
                            <span className="font-bold text-slate-700">{sale.customer.phone}</span>
                          </div>
                        )}
                        {due > 0 && (
                          <div className="col-span-2 text-amber-700 font-bold">
                            Due Amount: ৳{due.toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Items table */}
                      {sale.items && sale.items.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purchased Items</p>
                          <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/70 overflow-hidden">
                            {sale.items.map((it, idx) => (
                              <div key={it.id || idx} className="flex items-center justify-between p-2">
                                <div className="min-w-0 flex-1 pr-2">
                                  <p className="font-bold text-slate-800 truncate">{it.name || it.productName || "Product"}</p>
                                  <p className="text-[10px] text-slate-400">
                                    Qty: {it.qty} × ৳{Number(it.unitPrice || 0).toFixed(2)}
                                  </p>
                                </div>
                                <p className="font-black text-slate-700 shrink-0 tabular-nums">
                                  ৳{Number(it.lineTotal || (it.qty || 0) * (it.unitPrice || 0)).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No line item details available for this record.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </SlideOver>
  );
}

// ═══════════════════════════════════════════
// PRESCRIPTION MODAL
// ═══════════════════════════════════════════
interface PrescriptionModalProps {
  open: boolean;
  onClose: () => void;
  onAttach: (rxNo: string, doctorName: string, notes: string) => void;
}

export function PrescriptionModal({ open, onClose, onAttach }: PrescriptionModalProps) {
  const [rxNo, setRxNo] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [notes, setNotes] = useState("");

  function handleAttach() {
    onAttach(rxNo, doctorName, notes);
    onClose();
  }

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="Prescription (Rx)"
      Icon={Shield}
      iconColor="text-purple-600"
      iconBg="bg-purple-50"
    >
      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-[11px] font-bold text-slate-500">Rx / Prescription No.</label>
          <input
            type="text"
            value={rxNo}
            onChange={(e) => setRxNo(e.target.value)}
            placeholder="e.g. RX-2024-00123"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-semibold text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </div>
        <div>
          <label className="block mb-1 text-[11px] font-bold text-slate-500">Prescribing Doctor</label>
          <input
            type="text"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="e.g. Dr. Abdul Karim"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-semibold text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </div>
        <div>
          <label className="block mb-1 text-[11px] font-bold text-slate-500">Notes / Instructions</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-semibold text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-none resize-none"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAttach}
            className="flex-1 rounded-xl bg-purple-600 py-2.5 text-[13px] font-bold text-white hover:bg-purple-700 transition shadow-sm"
          >
            Attach Prescription
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ═══════════════════════════════════════════
// ADD DOCTOR MODAL
// ═══════════════════════════════════════════
interface AddDoctorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (doctor: { name: string; regNo: string; specialty: string }) => void;
}

export function AddDoctorModal({ open, onClose, onSave }: AddDoctorModalProps) {
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [specialty, setSpecialty] = useState("General");

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name, regNo, specialty });
    setName(""); setRegNo(""); setSpecialty("General");
    onClose();
  }

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="Add Doctor"
      Icon={Stethoscope}
      iconColor="text-sky-600"
      iconBg="bg-sky-50"
    >
      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-[11px] font-bold text-slate-500">Doctor Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dr. Abdul Karim"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-semibold text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>
        <div>
          <label className="block mb-1 text-[11px] font-bold text-slate-500">Registration No.</label>
          <input
            type="text"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            placeholder="e.g. BMDC-12345"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-semibold text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block mb-1 text-[11px] font-bold text-slate-500">Specialty</label>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-semibold text-slate-800 focus:border-sky-500 focus:outline-none cursor-pointer"
          >
            {["General", "Cardiology", "Dermatology", "Endocrinology", "Gastroenterology", "Neurology", "Orthopedics", "Pediatrics", "Pulmonology"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={!name.trim()} className="flex-1 rounded-xl bg-sky-600 py-2.5 text-[13px] font-bold text-white hover:bg-sky-700 transition shadow-sm disabled:opacity-40">
            Save Doctor
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ═══════════════════════════════════════════
// LOYALTY MODAL
// ═══════════════════════════════════════════
interface LoyaltyModalProps {
  open: boolean;
  onClose: () => void;
  customerName: string;
  currentPoints: number;
  onRedeem: (points: number) => void;
}

export function LoyaltyModal({ open, onClose, customerName, currentPoints, onRedeem }: LoyaltyModalProps) {
  const [redeemPts, setRedeemPts] = useState("");

  function handleRedeem() {
    const pts = parseInt(redeemPts, 10) || 0;
    if (pts > 0 && pts <= currentPoints) {
      onRedeem(pts);
      onClose();
    }
  }

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="Loyalty Points"
      Icon={Heart}
      iconColor="text-rose-500"
      iconBg="bg-rose-50"
    >
      <div className="space-y-4">
        {/* Points card */}
        <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-5 text-white text-center">
          <p className="text-[11px] font-semibold opacity-80">{customerName || "Walk-in Customer"}</p>
          <p className="text-[38px] font-black tabular-nums">{currentPoints}</p>
          <p className="text-[11px] font-semibold opacity-80">Available Points</p>
          <p className="mt-1 text-[12px] font-bold opacity-90">≈ ৳{(currentPoints * 0.5).toFixed(2)} value</p>
        </div>

        {/* Redeem section */}
        <div>
          <label className="block mb-1 text-[11px] font-bold text-slate-500">Redeem Points</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={redeemPts}
              onChange={(e) => setRedeemPts(e.target.value)}
              placeholder={`Max ${currentPoints}`}
              min={1}
              max={currentPoints}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-semibold text-slate-800 focus:border-rose-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleRedeem}
              disabled={!redeemPts || parseInt(redeemPts) > currentPoints}
              className="rounded-xl bg-rose-500 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-rose-600 transition shadow-sm disabled:opacity-40"
            >
              Redeem
            </button>
          </div>
          <p className="mt-1 text-[10.5px] text-slate-400">1 point = ৳0.50 discount</p>
        </div>

        {/* Add bonus points (mock) */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
            <TrendingUp size={13} />
            After this sale, you&apos;ll earn ~{Math.floor((currentPoints * 0.1))} bonus points
          </p>
        </div>

        <button type="button" onClick={onClose} className="w-full rounded-xl border border-slate-200 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition">
          Close
        </button>
      </div>
    </ModalWrapper>
  );
}

// ═══════════════════════════════════════════
// QUICK RETURN MODAL
// ═══════════════════════════════════════════
interface QuickReturnModalProps {
  open: boolean;
  onClose: () => void;
  cart: RxCartItem[];
  onReturn: (returns: { productId: string; name: string; qty: number; unitPrice: number }[]) => void;
}

export function QuickReturnModal({ open, onClose, cart, onReturn }: QuickReturnModalProps) {
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});

  function setQty(productId: string, qty: number) {
    setReturnQtys((prev) => ({ ...prev, [productId]: qty }));
  }

  function handleReturn() {
    const returns = cart
      .filter((item) => (returnQtys[item.productId] ?? 0) > 0)
      .map((item) => ({
        productId: item.productId,
        name: item.name,
        qty: returnQtys[item.productId],
        unitPrice: item.unitPrice,
      }));
    if (returns.length > 0) {
      onReturn(returns);
      onClose();
    }
  }

  const totalRefund = cart.reduce((s, item) => {
    const qty = returnQtys[item.productId] ?? 0;
    return s + qty * item.unitPrice;
  }, 0);

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="Quick Return"
      Icon={RotateCcw}
      iconColor="text-orange-500"
      iconBg="bg-orange-50"
      maxWidth="max-w-lg"
    >
      <div className="space-y-3">
        {cart.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-6">No items in cart to return</p>
        ) : (
          <>
            <p className="text-[11px] font-semibold text-slate-500">Select items and quantity to return:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cart.map((item) => {
                const returnQty = returnQtys[item.productId] ?? 0;
                return (
                  <div key={item.productId} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-extrabold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10.5px] text-slate-400">৳{item.unitPrice.toFixed(2)} × {item.qty} ordered</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setQty(item.productId, Math.max(0, returnQty - 1))}
                        className="flex h-6 w-6 items-center justify-center rounded bg-white shadow-2xs text-slate-600 hover:bg-slate-100 transition"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="w-6 text-center text-[11px] font-extrabold text-slate-800">{returnQty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(item.productId, Math.min(item.qty, returnQty + 1))}
                        className="flex h-6 w-6 items-center justify-center rounded bg-white shadow-2xs text-slate-600 hover:bg-slate-100 transition"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalRefund > 0 && (
              <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 flex items-center justify-between">
                <span className="text-[12px] font-bold text-orange-700">Total Refund:</span>
                <span className="text-[16px] font-black text-orange-600 tabular-nums">৳{totalRefund.toFixed(2)}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReturn}
                disabled={totalRefund === 0}
                className="flex-1 rounded-xl bg-orange-500 py-2.5 text-[13px] font-bold text-white hover:bg-orange-600 transition shadow-sm disabled:opacity-40"
              >
                Process Return
              </button>
            </div>
          </>
        )}
      </div>
    </ModalWrapper>
  );
}

// ═══════════════════════════════════════════
// ADD CUSTOMER MODAL
// ═══════════════════════════════════════════
export interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (customer: { id: string; name: string; phone: string | null; address?: string | null }) => void;
  customers?: { id: string; name: string; phone?: string | null; email?: string | null; address?: string | null }[];
  selectedCustomerId?: string;
  onSelectCustomer?: (id: string) => void;
  darkMode?: boolean;
  initialTab?: "view" | "add";
}

export function AddCustomerModal({
  open,
  onClose,
  onSave,
  customers = [],
  selectedCustomerId = "",
  onSelectCustomer,
  darkMode = false,
  initialTab = "view",
}: AddCustomerModalProps) {
  const [tab, setTab] = useState<"view" | "add">(initialTab);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setSearch("");
    }
  }, [open, initialTab]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [customers, search]);

  function handleSave() {
    if (!name.trim()) return;
    const newCust = {
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: phone.trim() || null,
      address: address.trim() || null,
    };
    onSave(newCust);
    if (onSelectCustomer) {
      onSelectCustomer(newCust.id);
    }
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    onClose();
  }

  function handleSelect(id: string) {
    if (onSelectCustomer) {
      onSelectCustomer(id);
    }
    onClose();
  }

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="Customer Management"
      subtitle="View customer directory or register a new customer"
      Icon={User}
      iconColor="text-[#00796b]"
      iconBg="bg-[#e0f2f1]"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className={cn("flex rounded-xl p-1 border", darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200")}>
          <button
            type="button"
            onClick={() => setTab("view")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition",
              tab === "view"
                ? "bg-[#00796b] text-white shadow-2xs"
                : darkMode
                ? "text-slate-300 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <User size={14} />
            <span>View Customers ({customers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("add")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition",
              tab === "add"
                ? "bg-[#00796b] text-white shadow-2xs"
                : darkMode
                ? "text-slate-300 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Plus size={14} />
            <span>Add New Customer</span>
          </button>
        </div>

        {tab === "view" ? (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer by name, phone or address..."
                className={cn(
                  "w-full rounded-xl border pl-9 pr-3 py-2 text-xs font-medium focus:outline-none transition",
                  darkMode
                    ? "border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-teal-500"
                    : "border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:border-[#00897b]"
                )}
              />
            </div>

            {/* Customers List */}
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {/* Walk-in default item */}
              <div
                onClick={() => handleSelect("")}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition",
                  !selectedCustomerId
                    ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/30"
                    : darkMode
                    ? "border-slate-800 bg-slate-900 hover:border-slate-700"
                    : "border-slate-200 bg-white hover:border-teal-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-extrabold text-xs">
                    W
                  </div>
                  <div>
                    <h4 className={cn("text-xs font-extrabold", darkMode ? "text-slate-100" : "text-slate-800")}>Walk-in Customer</h4>
                    <p className="text-[10px] text-slate-400">Default generic sale</p>
                  </div>
                </div>
                {!selectedCustomerId ? (
                  <span className="rounded-full bg-[#00796b] px-2.5 py-1 text-[10px] font-black text-white">Active</span>
                ) : (
                  <button type="button" className="rounded-lg border px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300">Select</button>
                )}
              </div>

              {filteredCustomers.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <User size={28} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold">No customers found</p>
                  <button
                    type="button"
                    onClick={() => setTab("add")}
                    className="mt-2 text-xs font-bold text-[#00796b] hover:underline"
                  >
                    + Add "{search}" as new customer
                  </button>
                </div>
              ) : (
                filteredCustomers.map((c) => {
                  const isSelected = c.id === selectedCustomerId;
                  const initials = c.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelect(c.id)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition",
                        isSelected
                          ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/30"
                          : darkMode
                          ? "border-slate-800 bg-slate-900 hover:border-slate-700"
                          : "border-slate-200 bg-white hover:border-teal-200"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white font-extrabold text-xs">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h4 className={cn("text-xs font-extrabold truncate", darkMode ? "text-slate-100" : "text-slate-800")}>{c.name}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {c.phone && (
                              <span className="flex items-center gap-0.5">
                                <Phone size={10} /> {c.phone}
                              </span>
                            )}
                            {c.address && (
                              <span className="flex items-center gap-0.5 truncate">
                                <MapPin size={10} /> {c.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="rounded-full bg-[#00796b] px-2.5 py-1 text-[10px] font-black text-white shrink-0">Selected</span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleSelect(c.id); }}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-teal-50 hover:text-[#00796b] transition shrink-0"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Add Form */
          <div className="space-y-3.5">
            <div>
              <label className={cn("block mb-1 text-[11px] font-bold", darkMode ? "text-slate-300" : "text-slate-600")}>Full Name *</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Customer full name"
                  className={cn(
                    "w-full rounded-xl border pl-8 pr-3 py-2 text-[13px] font-semibold focus:outline-none transition",
                    darkMode
                      ? "border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-teal-500"
                      : "border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:border-[#00897b]"
                  )}
                />
              </div>
            </div>
            <div>
              <label className={cn("block mb-1 text-[11px] font-bold", darkMode ? "text-slate-300" : "text-slate-600")}>Phone Number</label>
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className={cn(
                    "w-full rounded-xl border pl-8 pr-3 py-2 text-[13px] font-semibold focus:outline-none transition",
                    darkMode
                      ? "border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-teal-500"
                      : "border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:border-[#00897b]"
                  )}
                />
              </div>
            </div>
            <div>
              <label className={cn("block mb-1 text-[11px] font-bold", darkMode ? "text-slate-300" : "text-slate-600")}>Email (optional)</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className={cn(
                    "w-full rounded-xl border pl-8 pr-3 py-2 text-[13px] font-semibold focus:outline-none transition",
                    darkMode
                      ? "border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-teal-500"
                      : "border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:border-[#00897b]"
                  )}
                />
              </div>
            </div>
            <div>
              <label className={cn("block mb-1 text-[11px] font-bold", darkMode ? "text-slate-300" : "text-slate-600")}>Address (optional)</label>
              <div className="relative">
                <MapPin size={13} className="absolute left-3 top-3 text-slate-400" />
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House, Road, Area, City..."
                  className={cn(
                    "w-full rounded-xl border pl-8 pr-3 py-2 text-[13px] font-semibold focus:outline-none resize-none transition",
                    darkMode
                      ? "border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-teal-500"
                      : "border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:border-[#00897b]"
                  )}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTab("view")}
                className={cn(
                  "flex-1 rounded-xl border py-2.5 text-[13px] font-bold transition",
                  darkMode
                    ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                )}
              >
                Back to Directory
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!name.trim()}
                className="flex-1 rounded-xl bg-[#00796b] py-2.5 text-[13px] font-bold text-white hover:bg-[#005a50] transition shadow-xs disabled:opacity-40"
              >
                Save & Select Customer
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}

// ═══════════════════════════════════════════
// HARDWARE SETTINGS MODAL
// ═══════════════════════════════════════════
export interface HardwareConfig {
  receiptPrinter: boolean;
  cashDrawer: boolean;
  barcodeScanner: boolean;
  cardTerminal: boolean;
  customerDisplay: boolean;
}

export const DEFAULT_HARDWARE_CONFIG: HardwareConfig = {
  receiptPrinter: true,
  cashDrawer: true,
  barcodeScanner: true,
  cardTerminal: false,
  customerDisplay: false,
};

interface HardwareSettingsModalProps {
  open: boolean;
  onClose: () => void;
  config: HardwareConfig;
  onSaveConfig: (cfg: HardwareConfig) => void;
}

export function HardwareSettingsModal({
  open,
  onClose,
  config,
  onSaveConfig,
}: HardwareSettingsModalProps) {
  const [draft, setDraft] = useState<HardwareConfig>(config);

  useEffect(() => {
    if (open) setDraft(config);
  }, [open, config]);

  if (!open) return null;

  function toggle(key: keyof HardwareConfig) {
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    onSaveConfig(draft);
    onClose();
  }

  const items: { key: keyof HardwareConfig; label: string; IconComp: React.ElementType }[] = [
    { key: "receiptPrinter", label: "Thermal Receipt Printer", IconComp: Printer },
    { key: "cashDrawer", label: "Cash Drawer", IconComp: Archive },
    { key: "barcodeScanner", label: "Barcode Scanner", IconComp: ScanBarcode },
    // Kitchen Printer omitted as explicitly requested by user
    { key: "cardTerminal", label: "Card Terminal", IconComp: CreditCard },
    { key: "customerDisplay", label: "Customer Display", IconComp: Monitor },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

      {/* Main Card Dialog */}
      <div className="relative w-full max-w-md rounded-3xl bg-[#fbf5f2] p-6 shadow-2xl overflow-hidden border border-amber-100/60 dark:bg-slate-900 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffe6dc] text-[#ff5722] shadow-2xs dark:bg-orange-950/60 dark:text-orange-400">
            <Sliders size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-[19px] font-extrabold text-slate-800 tracking-tight dark:text-slate-100">
              Hardware Settings
            </h2>
          </div>
        </div>

        {/* Hardware Items List */}
        <div className="divide-y divide-slate-200/70 border-y border-slate-200/70 py-1 dark:divide-slate-800 dark:border-slate-800">
          {items.map(({ key, label, IconComp }) => {
            const enabled = draft[key];
            return (
              <div key={key} className="flex items-center justify-between py-3.5 px-1">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 shadow-2xs border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700">
                    <IconComp size={19} className="text-slate-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100">{label}</p>
                    <p className="text-[11px] font-semibold text-slate-400">
                      {enabled ? "• Enabled" : "• Disabled"}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => toggle(key)}
                  className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out border-2 border-transparent focus:outline-none",
                    enabled ? "bg-[#8c7b75]" : "bg-slate-300 dark:bg-slate-700",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out",
                      enabled ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Info Alert Box */}
        <div className="mt-5 rounded-2xl bg-[#e3f2fd] border border-[#bbdefb] p-3.5 flex items-start gap-3 dark:bg-sky-950/40 dark:border-sky-900/60">
          <Info size={18} className="text-[#1976d2] shrink-0 mt-0.5" />
          <p className="text-[11.5px] font-medium text-[#1565c0] dark:text-sky-200 leading-snug">
            Full hardware activation requires SDK/driver integration. UI is ready — connect ESC/POS, Bluetooth or USB packages in the backend to activate.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-[13px] font-bold text-red-500 hover:text-red-600 transition dark:text-red-400"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-2xl bg-[#ff5722] hover:bg-[#e64a19] text-white px-5 py-2.5 text-[13px] font-bold shadow-md transition active:scale-95"
          >
            <Save size={15} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// NOTIFICATION DROPDOWN
// ═══════════════════════════════════════════
export interface NotificationItem {
  id: string | number;
  type: "warning" | "error" | "success" | "info";
  title: string;
  body: string;
  time: string;
  read?: boolean;
}

interface NotificationDropdownProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
  onDismiss?: (id: string | number) => void;
}

export function NotificationDropdown({
  open,
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll,
  onDismiss,
}: NotificationDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-1.5 w-84 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/80">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-black text-slate-800">Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-[10.5px] font-bold text-[#00796b] hover:underline"
            >
              Mark read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[10.5px] font-bold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Bell size={28} className="mb-2 text-slate-300" />
            <p className="text-[12px] font-semibold">No notifications</p>
            <p className="text-[10.5px] text-slate-400">All alerts cleared</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "group flex items-start gap-3 px-4 py-3 transition relative hover:bg-slate-50",
                !n.read ? "bg-teal-50/40" : "",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-0.5",
                  n.type === "warning" ? "bg-amber-100 text-amber-600" :
                    n.type === "error" ? "bg-rose-100 text-rose-600" :
                    n.type === "info" ? "bg-sky-100 text-sky-600" :
                      "bg-emerald-100 text-emerald-600",
                )}
              >
                {n.type === "warning" || n.type === "error" ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-[11.5px] font-extrabold text-slate-800">{n.title}</p>
                <p className="text-[10.5px] font-medium text-slate-500 truncate">{n.body}</p>
                <p className="mt-0.5 text-[9.5px] font-semibold text-slate-400">{n.time}</p>
              </div>
              {onDismiss && (
                <button
                  type="button"
                  onClick={() => onDismiss(n.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition absolute right-2 top-2"
                  title="Dismiss"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PROFILE DROPDOWN
// ═══════════════════════════════════════════
interface ProfileDropdownProps {
  open: boolean;
  onClose: () => void;
  cashierName: string;
  terminalName?: string;
  onOpenSettings?: () => void;
}

export function ProfileDropdown({
  open,
  onClose,
  cashierName,
  terminalName = "PC-01",
  onOpenSettings,
}: ProfileDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden"
    >
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-[12px] font-extrabold text-slate-800">{cashierName}</p>
        <p className="text-[10px] font-semibold text-slate-400">Terminal: {terminalName}</p>
      </div>
      <div className="py-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSettings?.();
          }}
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <Settings size={14} className="text-slate-600" />
          Hardware Settings
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <Clock size={14} className="text-slate-600" />
          Shift Report
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <Package size={14} className="text-slate-600" />
          Stock Check
        </button>
        <div className="border-t border-slate-100 mt-1 pt-1">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// ADVANCED FILTER PANEL
// ═══════════════════════════════════════════
interface AdvancedFilterPanelProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: { minPrice: number; maxPrice: number; brand: string; inStockOnly: boolean }) => void;
}

export function AdvancedFilterPanel({ open, onClose, onApply }: AdvancedFilterPanelProps) {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);

  function handleApply() {
    onApply({
      minPrice: parseFloat(minPrice) || 0,
      maxPrice: parseFloat(maxPrice) || Infinity,
      brand,
      inStockOnly,
    });
    onClose();
  }

  function handleReset() {
    setMinPrice(""); setMaxPrice(""); setBrand(""); setInStockOnly(false);
    onApply({ minPrice: 0, maxPrice: Infinity, brand: "", inStockOnly: false });
    onClose();
  }

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="Advanced Filter"
      Icon={SlidersHorizontal}
      iconColor="text-slate-600"
      iconBg="bg-slate-100"
    >
      <div className="space-y-4">
        <div>
          <label className="block mb-1.5 text-[11px] font-bold text-slate-500">Price Range (৳)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-semibold text-slate-800 placeholder-slate-400 focus:border-[#00897b] focus:outline-none"
            />
            <span className="text-slate-400 font-semibold">—</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-semibold text-slate-800 placeholder-slate-400 focus:border-[#00897b] focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block mb-1.5 text-[11px] font-bold text-slate-500">Brand / Manufacturer</label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Square, Beximco, ACI..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-semibold text-slate-800 placeholder-slate-400 focus:border-[#00897b] focus:outline-none"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="h-4 w-4 accent-[#00796b] cursor-pointer"
          />
          <span className="text-[12.5px] font-semibold text-slate-700">In Stock Only</span>
        </label>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={handleReset} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition">
            Reset
          </button>
          <button type="button" onClick={handleApply} className="flex-1 rounded-xl bg-[#00796b] py-2.5 text-[13px] font-bold text-white hover:bg-[#005a50] transition shadow-sm">
            Apply Filters
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ═══════════════════════════════════════════
// GENERIC ALTERNATIVES MODAL
// ═══════════════════════════════════════════

interface GenericAlternativesModalProps {
  open: boolean;
  onClose: () => void;
  originalProduct: RegisterProduct | null;
  alternatives: RegisterProduct[];
  onSelectAlternative: (p: RegisterProduct) => void;
}

export function GenericAlternativesModal({
  open,
  onClose,
  originalProduct,
  alternatives,
  onSelectAlternative,
}: GenericAlternativesModalProps) {
  if (!open || !originalProduct) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 bg-[#f0faf8]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00796b] text-white shadow-sm">
            <Leaf size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-black text-slate-900">Generic Alternatives</h2>
            <p className="text-[11px] font-medium text-slate-500 truncate">
              For: <span className="font-bold text-[#00796b]">{originalProduct.name}</span>
              {" "}· Original: <span className="font-bold">৳{originalProduct.sellingPrice.toFixed(2)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={17} />
          </button>
        </div>

        {/* Info strip */}
        <div className="flex items-center gap-2 bg-emerald-50 border-b border-emerald-100 px-5 py-2.5">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          <p className="text-[11.5px] font-semibold text-emerald-700">
            Generic medicines have the same active ingredient but cost significantly less.
          </p>
        </div>

        {/* Alternatives List */}
        <div className="max-h-[380px] overflow-y-auto p-4 space-y-2.5">
          {alternatives.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Leaf size={36} className="mb-3 text-slate-200" />
              <p className="text-[13px] font-semibold">No generic alternatives found</p>
              <p className="text-[11px] mt-1">Try searching manually by ingredient name</p>
            </div>
          ) : (
            alternatives.map((alt) => {
              const saving = originalProduct.sellingPrice - alt.sellingPrice;
              const savingPct = originalProduct.sellingPrice > 0
                ? Math.round((saving / originalProduct.sellingPrice) * 100)
                : 0;
              const isCheaper = saving > 0;

              return (
                <div
                  key={alt.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 hover:border-[#00796b]/40 hover:bg-[#f0faf8] transition"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#00796b]">
                    <Leaf size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-extrabold text-slate-800 truncate">{alt.name}</p>
                    <p className="text-[10.5px] font-medium text-slate-400 truncate">
                      {alt.unit || "Generic"} · Stock: {alt.stockQty ?? 0}
                    </p>
                    {isCheaper && (
                      <p className="mt-0.5 text-[10px] font-bold text-emerald-600">
                        Saves ৳{saving.toFixed(2)} ({savingPct}% cheaper)
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[15px] font-black text-[#00796b] tabular-nums">
                      ৳{alt.sellingPrice.toFixed(2)}
                    </p>
                    {isCheaper && (
                      <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700 mt-0.5">
                        -{savingPct}% OFF
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAlternative(alt);
                      onClose();
                    }}
                    disabled={(alt.stockQty ?? 0) <= 0}
                    className="ml-1 shrink-0 flex items-center gap-1.5 rounded-xl bg-[#00796b] px-3.5 py-2 text-[12px] font-bold text-white shadow-sm hover:bg-[#005a50] transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Plus size={13} strokeWidth={2.8} />
                    Add
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between bg-slate-50/70">
          <p className="text-[10.5px] font-medium text-slate-400">
            Consult a pharmacist before switching to a generic.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PAYMENT CHECKOUT MODAL
// ═══════════════════════════════════════════
export type CheckoutPayMethod = "CASH" | "CARD" | "MOBILE" | "BANK" | "CREDIT";

interface CheckoutPayMethodDef {
  id: CheckoutPayMethod;
  label: string;
  icon: React.ReactNode;
  desc: string;
}

const CHECKOUT_METHODS: CheckoutPayMethodDef[] = [
  {
    id: "CASH",
    label: "Cash",
    desc: "Physical currency",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M6 12h.01M18 12h.01" />
      </svg>
    ),
  },
  {
    id: "CARD",
    label: "Card",
    desc: "Debit / Credit",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 15h2M10 15h4" />
      </svg>
    ),
  },
  {
    id: "MOBILE",
    label: "Mobile",
    desc: "bKash / Nagad",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
  {
    id: "BANK",
    label: "Bank",
    desc: "Bank Transfer",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    id: "CREDIT",
    label: "Credit",
    desc: "Store credit",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
];

const CASH_DENOMINATIONS = [10, 20, 50, 100, 200, 500, 1000, 2000];

export interface PaymentCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  subtotal: number;
  totalDiscount: number;
  vatAmount: number;
  itemCount: number;
  customerName?: string;
  cashierName?: string;
  payMethod: CheckoutPayMethod;
  onChangePayMethod: (m: CheckoutPayMethod) => void;
  onConfirm: (cashTendered?: number, printReceipt?: boolean) => void;
  submitting?: boolean;
  darkMode?: boolean;
}

export function PaymentCheckoutModal({
  open,
  onClose,
  total,
  subtotal,
  totalDiscount,
  vatAmount,
  itemCount,
  customerName = "Walk-in",
  cashierName = "Pharmacist",
  payMethod,
  onChangePayMethod,
  onConfirm,
  submitting,
  darkMode,
}: PaymentCheckoutModalProps) {
  const [cashInput, setCashInput] = useState<string>("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const refInput = useRef<HTMLInputElement>(null);

  const cashTendered = parseFloat(cashInput) || 0;
  const change = Math.max(cashTendered - total, 0);
  const isExact = cashTendered > 0 && cashTendered === total;
  const canPay = payMethod !== "CASH" || cashTendered >= total;

  useEffect(() => {
    if (open) {
      setCashInput("");
      setTimeout(() => refInput.current?.focus(), 120);
    }
  }, [open]);

  function addDenom(d: number) {
    setCashInput((prev) => {
      const cur = parseFloat(prev) || 0;
      return (cur + d).toString();
    });
  }

  function setExact() {
    setCashInput(total.toFixed(2));
  }

  function handleConfirm() {
    onConfirm(payMethod === "CASH" ? cashTendered : undefined, printReceipt);
  }

  if (!open) return null;

  const textPrimary = darkMode ? "text-slate-100" : "text-slate-900";
  const textSub = darkMode ? "text-slate-400" : "text-slate-500";
  const cardBg = darkMode ? "bg-slate-800/60 border-slate-700" : "bg-slate-50/50 border-slate-200";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={cn(
          "relative w-full max-w-[480px] rounded-3xl shadow-2xl overflow-hidden border animate-in zoom-in-95 fade-in duration-200",
          darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}
      >
        {/* ── HEADER ── */}
        <div className={cn(
          "flex items-center justify-between px-5 py-4 border-b",
          darkMode ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-gradient-to-r from-[#e0f7f4] to-white"
        )}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00796b] text-white shadow-md">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="12" height="5" rx="1" />
                <path d="M5 9h14l1 9H4l1-9z" />
                <path d="M8 12h.01M12 12h.01M16 12h.01" strokeWidth="2.5" />
              </svg>
            </div>
            <div>
              <h2 className={cn("text-[17px] font-black", textPrimary)}>Checkout & Payment</h2>
              <p className={cn("text-[10.5px] font-semibold", textSub)}>
                {itemCount} item{itemCount !== 1 ? "s" : ""} · {customerName} · {cashierName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "rounded-xl p-2 transition",
              darkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100"
            )}
          >
            <X size={17} />
          </button>
        </div>

        {/* ── TOTAL DUE STRIP ── */}
        <div className={cn(
          "flex items-center justify-between gap-4 px-5 py-3.5 border-b",
          darkMode ? "border-slate-800 bg-slate-800/60" : "border-slate-100 bg-[#f0faf8]"
        )}>
          <div>
            <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-0.5", textSub)}>Total Due</p>
            <p className="text-[32px] font-black tabular-nums text-[#00796b] leading-none">
              ৳{total.toFixed(2)}
            </p>
          </div>
          <div className={cn("text-[10.5px] font-semibold space-y-0.5 text-right shrink-0", textSub)}>
            <div className="flex justify-between gap-6">
              <span>Subtotal</span>
              <span className={textPrimary}>৳{subtotal.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between gap-6">
                <span>Discount</span>
                <span className="text-emerald-500">−৳{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between gap-6">
              <span>VAT (5%)</span>
              <span className={textPrimary}>৳{vatAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* PAYMENT METHODS */}
          <div>
            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-2.5", textSub)}>Payment Method</p>
            <div className="grid grid-cols-5 gap-1.5">
              {CHECKOUT_METHODS.map(({ id, label, icon, desc }) => {
                const active = payMethod === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChangePayMethod(id)}
                    title={desc}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 rounded-2xl border py-3.5 text-center transition",
                      active
                        ? "border-[#00796b] bg-[#00796b] text-white shadow-lg scale-[1.03]"
                        : darkMode
                          ? "border-slate-700 bg-slate-800 text-slate-400 hover:border-teal-700 hover:bg-slate-700 hover:text-teal-300"
                          : "border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:bg-teal-50 hover:text-[#00796b]"
                    )}
                  >
                    {icon}
                    <span className="text-[10px] font-black">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CASH TENDERING */}
          {payMethod === "CASH" && (
            <div className={cn("rounded-2xl border p-4 space-y-3", cardBg)}>
              <div className="flex items-center justify-between">
                <p className={cn("text-[10px] font-black uppercase tracking-widest", textSub)}>Cash Tendered</p>
                <button
                  type="button"
                  onClick={setExact}
                  className="text-[11px] font-bold text-[#00796b] hover:underline"
                >
                  Exact Amount
                </button>
              </div>

              {/* Amount input */}
              <div className="relative">
                <span className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-black", darkMode ? "text-slate-500" : "text-slate-400")}>৳</span>
                <input
                  ref={refInput}
                  type="number"
                  min="0"
                  step="1"
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
                  placeholder="0.00"
                  className={cn(
                    "w-full rounded-xl border pl-9 pr-4 py-3 text-[24px] font-black text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-[#00796b]/30 focus:border-[#00796b] transition",
                    darkMode ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-600" : "bg-white border-slate-200 text-slate-900 placeholder-slate-300",
                    isExact ? "border-emerald-400 focus:ring-emerald-200" : ""
                  )}
                />
                {isExact && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ✓ Exact
                  </span>
                )}
              </div>

              {/* Quick denomination grid */}
              <div className="grid grid-cols-4 gap-1.5">
                {CASH_DENOMINATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => addDenom(d)}
                    className={cn(
                      "rounded-xl border py-2.5 text-[11.5px] font-black transition",
                      darkMode
                        ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-teal-900/60 hover:border-teal-800 hover:text-teal-300"
                        : "border-slate-200 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50 hover:text-[#00796b]"
                    )}
                  >
                    +৳{d >= 1000 ? `${d / 1000}k` : d}
                  </button>
                ))}
              </div>

              {/* Change to return */}
              <div className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3 transition",
                change > 0
                  ? "border-emerald-300 bg-emerald-50"
                  : darkMode
                    ? "border-slate-700 bg-slate-800/60"
                    : "border-slate-200 bg-white"
              )}>
                <span className={cn(
                  "text-[12.5px] font-bold",
                  change > 0 ? "text-emerald-700" : textSub
                )}>
                  Change to Return
                </span>
                <span className={cn(
                  "text-[20px] font-black tabular-nums",
                  change > 0 ? "text-emerald-600" : darkMode ? "text-slate-500" : "text-slate-400"
                )}>
                  ৳{change.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* NON-CASH NOTICE */}
          {payMethod !== "CASH" && (
            <div className={cn(
              "flex items-center gap-3 rounded-2xl border px-4 py-3.5",
              darkMode ? "border-teal-900/60 bg-teal-950/30" : "border-teal-200 bg-teal-50"
            )}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#00796b] text-white">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className={cn("text-[13px] font-extrabold", darkMode ? "text-teal-300" : "text-[#00796b]")}>
                  {CHECKOUT_METHODS.find(m => m.id === payMethod)?.label} Payment Selected
                </p>
                <p className={cn("text-[11px] font-medium mt-0.5", darkMode ? "text-teal-500" : "text-teal-600/80")}>
                  {CHECKOUT_METHODS.find(m => m.id === payMethod)?.desc} · Amount: ৳{total.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* PRINT TOGGLE */}
          <div className={cn(
            "flex items-center justify-between rounded-xl border px-4 py-3",
            darkMode ? "border-slate-700 bg-slate-800/40" : "border-slate-200 bg-white"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl",
                darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
              )}>
                <Printer size={15} />
              </div>
              <div>
                <p className={cn("text-[12.5px] font-bold", textPrimary)}>Print Receipt</p>
                <p className={cn("text-[10px] font-medium", textSub)}>Thermal receipt printer</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={printReceipt}
              onClick={() => setPrintReceipt((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none",
                printReceipt ? "bg-[#00796b]" : darkMode ? "bg-slate-700" : "bg-slate-300"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out mt-0.5",
                  printReceipt ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className={cn(
          "flex items-center gap-2.5 px-5 py-4 border-t",
          darkMode ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white"
        )}>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "rounded-2xl border px-5 py-3 text-[13px] font-bold transition",
              darkMode
                ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!canPay || !!submitting}
            onClick={handleConfirm}
            className={cn(
              "flex-1 flex items-center justify-between rounded-2xl px-5 py-3 text-white shadow-lg transition-all active:scale-[0.99]",
              canPay
                ? "bg-[#00695c] hover:bg-[#005247]"
                : "bg-slate-300 cursor-not-allowed",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} strokeWidth={2.5} />
              <span className="text-[14px] font-black">
                {submitting ? "Processing..." : "Complete Payment"}
              </span>
            </div>
            <span className="text-[18px] font-black tabular-nums">৳{total.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
