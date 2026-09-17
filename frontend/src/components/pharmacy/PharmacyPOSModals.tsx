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
import {
  CustomButton,
  CustomInput,
  CustomSelect,
  CustomTextarea,
  CustomBadge,
  StatusBadge,
  CustomCheckbox,
  CustomSwitch,
  CustomTabs,
  CustomModal,
  CustomCard,
} from "@/components/custom";

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
    success: "bg-gradient-to-br from-[#00796b] to-[#00897b] border border-teal-500/30",
    error: "bg-gradient-to-br from-rose-600 to-pink-600 border border-rose-500/30",
    info: "bg-gradient-to-br from-[#004d40] to-[#00695c] border border-teal-500/30 shadow-teal-950/20",
  };

  const Icon = type === "error" ? AlertTriangle : type === "info" ? Info : CheckCircle2;

  return (
    <div
      className={cn(
        "fixed bottom-14 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-sm px-6 py-3.5 text-white shadow-2xl text-[14px] font-bold animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300",
        colors[type],
      )}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-white/20 backdrop-blur-md">
        <Icon size={14} strokeWidth={3} className="text-white" />
      </div>
      <span className="tracking-tight">{message}</span>
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
  darkMode?: boolean;
}

export function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  Icon,
  iconColor = "text-[#00796b]",
  iconBg = "bg-teal-50 border border-teal-200/80",
  children,
  width = "w-[560px] xl:w-[640px]",
  darkMode,
}: SlideOverProps) {
  if (!open) return null;
  const isDark = darkMode ?? (typeof document !== "undefined" && (
    document.documentElement.classList.contains("dark") ||
    localStorage.getItem("bpos_dark_mode") === "true"
  ));

  return (
    <div className={cn("fixed inset-0 z-50 flex", isDark && "dark")}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          "relative ml-auto flex h-full flex-col shadow-2xl border-l",
          isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800",
          width,
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex flex-none items-center gap-3 border-b px-5 py-4",
          isDark ? "border-slate-800 bg-slate-900" : "border-teal-100 bg-gradient-to-r from-teal-50/80 via-white to-teal-50/50"
        )}>
          {Icon && (
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-sm shrink-0", isDark ? "bg-slate-800 border border-slate-700 text-teal-400" : iconBg)}>
              <Icon size={18} className={isDark ? "text-teal-400" : iconColor} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className={cn("text-[15px] font-bold", isDark ? "text-teal-400" : "text-[#00796b]")}>{title}</h2>
            {subtitle && <p className={cn("text-[11px] font-medium", isDark ? "text-slate-400" : "text-slate-400")}>{subtitle}</p>}
          </div>
          <CustomButton
            variant="danger"
            size="xs"
            onClick={onClose}
            className="h-8 w-8 !p-0 rounded-sm flex items-center justify-center border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer shadow-2xs shrink-0"
            aria-label="Close panel"
          >
            <X size={17} />
          </CustomButton>
        </div>
        {/* Body */}
        <div className={cn("min-h-0 flex-1 overflow-y-auto", isDark ? "bg-slate-900 text-slate-100" : "bg-white")}>{children}</div>
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
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
  darkMode?: boolean;
}

export function ModalWrapper({
  open,
  onClose,
  title,
  subtitle,
  Icon,
  children,
  maxWidth,
  size = "xl",
  darkMode,
}: ModalWrapperProps) {
  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={Icon ? <Icon size={18} /> : undefined}
      size={size}
      maxWidth={maxWidth}
      darkMode={darkMode}
      themeColor="teal"
    >
      {children}
    </CustomModal>
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
  darkMode?: boolean;
}

export function SalesHistoryPanel({ open, onClose, darkMode }: SalesHistoryPanelProps) {
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
      width="w-[620px] xl:w-[720px]"
      darkMode={darkMode}
    >
      <div className="flex flex-col h-full">
        {/* Scope Tabs & Refresh */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl">
            <CustomButton
              size="xs"
              variant={viewScope === "today" ? "primary" : "ghost"}
              themeColor={viewScope === "today" ? "teal" : undefined}
              onClick={() => setViewScope("today")}
              className="px-3 py-1 text-[11px] font-bold rounded-lg h-auto"
            >
              Today
            </CustomButton>
            <CustomButton
              size="xs"
              variant={viewScope === "all" ? "primary" : "ghost"}
              themeColor={viewScope === "all" ? "teal" : undefined}
              onClick={() => setViewScope("all")}
              className="px-3 py-1 text-[11px] font-bold rounded-lg h-auto"
            >
              All Recent
            </CustomButton>
          </div>
          <CustomButton
            size="xs"
            variant="outline"
            themeColor="teal"
            onClick={fetchSales}
            disabled={loading}
            className="gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-xl h-auto"
            title="Refresh sales list"
          >
            <RefreshCw size={13} className={cn(loading && "animate-spin text-teal-600")} />
            Refresh
          </CustomButton>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3 border-b border-slate-100 px-5 py-3 bg-white">
          <div className="rounded-xl bg-emerald-50 p-3 text-center border border-emerald-100/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Sales</p>
            <p className="text-[18px] font-black text-emerald-600 tabular-nums">৳{totalRevenue.toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-teal-50 p-3 text-center border border-teal-100/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Transactions</p>
            <p className="text-[18px] font-black text-teal-700 tabular-nums">{transactionsCount}</p>
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
          <CustomInput
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice, customer, phone, payment..."
            leftIcon={<Search size={14} className="text-slate-400" />}
            rounded="xl"
            themeColor="teal"
            className="text-[12px] h-9"
          />
        </div>

        {/* Sales List / States */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5">
          {loading && sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 size={28} className="animate-spin text-[#00897b] mb-2" />
              <p className="text-[12px] font-medium">Loading sales history...</p>
            </div>
          ) : error ? (
            <div className="rounded-sm border border-rose-200 bg-rose-50/70 p-4 text-center">
              <AlertTriangle size={24} className="mx-auto text-rose-500 mb-1" />
              <p className="text-[12px] font-bold text-rose-700">{error}</p>
              <CustomButton
                size="xs"
                variant="danger"
                onClick={fetchSales}
                className="mt-2 text-[11px] font-bold px-3 py-1.5 rounded-xl h-auto"
              >
                Retry
              </CustomButton>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <div className="h-12 w-12 rounded-sm bg-slate-100 flex items-center justify-center mb-2 text-slate-400">
                <ReceiptText size={24} />
              </div>
              <p className="text-[13px] font-extrabold text-slate-600">No transactions found</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                {viewScope === "today"
                  ? "No sales have been recorded yet today. Switch to 'All Recent' to view previous transactions."
                  : "No sales records match your search."}
              </p>
              {viewScope === "today" && (
                <CustomButton
                  size="xs"
                  variant="outline"
                  themeColor="teal"
                  onClick={() => setViewScope("all")}
                  className="mt-3 text-[11px] font-bold px-3 py-1.5 rounded-xl h-auto"
                >
                  View All Recent Sales
                </CustomButton>
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
                    "rounded-sm border transition overflow-hidden bg-white",
                    isExpanded
                      ? "border-teal-300 ring-2 ring-teal-50 shadow-sm"
                      : "border-slate-200 hover:border-teal-200 hover:shadow-xs"
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
                        <StatusBadge status={status} className="mt-0.5" />
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
  darkMode?: boolean;
}

export function PrescriptionModal({ open, onClose, onAttach, darkMode }: PrescriptionModalProps) {
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
      subtitle="Attach prescription details and prescribing physician"
      Icon={Shield}
      iconColor="text-[#00796b]"
      iconBg="bg-teal-50"
      size="xl"
      darkMode={darkMode}
    >
      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">Rx / Prescription No.</label>
          <CustomInput
            value={rxNo}
            onChange={(e) => setRxNo(e.target.value)}
            placeholder="e.g. RX-2024-00123"
            themeColor="teal"
            darkMode={darkMode}
          />
        </div>
        <div>
          <label className="block mb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">Prescribing Doctor</label>
          <CustomInput
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="e.g. Dr. Abdul Karim"
            themeColor="teal"
            darkMode={darkMode}
          />
        </div>
        <div>
          <label className="block mb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">Notes / Instructions</label>
          <CustomTextarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special dosage or timing instructions..."
            darkMode={darkMode}
          />
        </div>
        <div className="flex gap-2.5 pt-2">
          <CustomButton variant="danger" className="flex-1" onClick={onClose}>
            Cancel
          </CustomButton>
          <CustomButton
            themeColor="teal"
            className="flex-1"
            onClick={handleAttach}
          >
            Attach Prescription
          </CustomButton>
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
  darkMode?: boolean;
}

export function AddDoctorModal({ open, onClose, onSave, darkMode }: AddDoctorModalProps) {
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
      subtitle="Register physician with medical registration number"
      Icon={Stethoscope}
      iconColor="text-[#00796b]"
      iconBg="bg-teal-50"
      size="xl"
      darkMode={darkMode}
    >
      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">Doctor Name *</label>
          <CustomInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dr. Abdul Karim"
            themeColor="teal"
            darkMode={darkMode}
          />
        </div>
        <div>
          <label className="block mb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">Registration No.</label>
          <CustomInput
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            placeholder="e.g. BMDC-12345"
            themeColor="teal"
            darkMode={darkMode}
          />
        </div>
        <div>
          <label className="block mb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">Specialty</label>
          <CustomSelect
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            themeColor="teal"
            darkMode={darkMode}
            options={[
              "General", "Cardiology", "Dermatology", "Endocrinology",
              "Gastroenterology", "Neurology", "Orthopedics", "Pediatrics", "Pulmonology"
            ].map((s) => ({ label: s, value: s }))}
          />
        </div>
        <div className="flex gap-2.5 pt-2">
          <CustomButton variant="danger" className="flex-1" onClick={onClose}>
            Cancel
          </CustomButton>
          <CustomButton
            themeColor="teal"
            className="flex-1"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Save Doctor
          </CustomButton>
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
  darkMode?: boolean;
}

export function LoyaltyModal({ open, onClose, customerName, currentPoints, onRedeem, darkMode }: LoyaltyModalProps) {
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
      subtitle="Redeem reward points for instant sale discounts"
      Icon={Heart}
      iconColor="text-rose-500"
      iconBg="bg-rose-50"
      size="xl"
      darkMode={darkMode}
    >
      <div className="space-y-4">
        {/* Points card */}
        <div className="rounded-sm bg-gradient-to-br from-rose-500 to-pink-600 p-5 text-white text-center">
          <p className="text-[11px] font-semibold opacity-80">{customerName || "Walk-in Customer"}</p>
          <p className="text-[38px] font-black tabular-nums">{currentPoints}</p>
          <p className="text-[11px] font-semibold opacity-80">Available Points</p>
          <p className="mt-1 text-[12px] font-bold opacity-90">≈ ৳{(currentPoints * 0.5).toFixed(2)} value</p>
        </div>

        {/* Redeem section */}
        <div>
          <label className="block mb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">Redeem Points</label>
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <CustomInput
                type="number"
                value={redeemPts}
                onChange={(e) => setRedeemPts(e.target.value)}
                placeholder={`Max ${currentPoints}`}
                min={1}
                max={currentPoints}
                themeColor="teal"
                darkMode={darkMode}
              />
            </div>
            <CustomButton
              type="button"
              onClick={handleRedeem}
              disabled={!redeemPts || parseInt(redeemPts) > currentPoints}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              Redeem
            </CustomButton>
          </div>
          <p className="mt-1 text-[10.5px] text-slate-400 dark:text-slate-500">1 point = ৳0.50 discount</p>
        </div>

        {/* Add bonus points (mock) */}
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-3">
          <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
            <TrendingUp size={13} />
            After this sale, you&apos;ll earn ~{Math.floor((currentPoints * 0.1))} bonus points
          </p>
        </div>

        <CustomButton variant="danger" className="w-full" onClick={onClose}>
          Close
        </CustomButton>
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
  darkMode?: boolean;
}

export function QuickReturnModal({ open, onClose, cart, onReturn, darkMode }: QuickReturnModalProps) {
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
      subtitle="Process refunds and inventory restocking for cart items"
      Icon={RotateCcw}
      iconColor="text-orange-500"
      iconBg="bg-orange-50"
      size="2xl"
      darkMode={darkMode}
    >
      <div className="space-y-4">
        {cart.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-6">No items in cart to return</p>
        ) : (
          <>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Select items and quantity to return:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cart.map((item) => {
                const returnQty = returnQtys[item.productId] ?? 0;
                return (
                  <div key={item.productId} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-extrabold text-slate-800 dark:text-slate-100 truncate">{item.name}</p>
                      <p className="text-[10.5px] text-slate-400 dark:text-slate-400">৳{item.unitPrice.toFixed(2)} × {item.qty} ordered</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-1">
                      <CustomButton
                        variant="ghost"
                        size="xs"
                        onClick={() => setQty(item.productId, Math.max(0, returnQty - 1))}
                        className="h-6 w-6 !p-0 rounded bg-white dark:bg-slate-800 shadow-2xs text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center"
                        icon={<Minus size={10} />}
                      />
                      <span className="w-6 text-center text-[11px] font-extrabold text-slate-800 dark:text-slate-100">{returnQty}</span>
                      <CustomButton
                        variant="ghost"
                        size="xs"
                        onClick={() => setQty(item.productId, Math.min(item.qty, returnQty + 1))}
                        className="h-6 w-6 !p-0 rounded bg-white dark:bg-slate-800 shadow-2xs text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center"
                        icon={<Plus size={10} />}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {totalRefund > 0 && (
              <div className="rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 px-4 py-3 flex items-center justify-between">
                <span className="text-[12px] font-bold text-orange-700 dark:text-orange-300">Total Refund:</span>
                <span className="text-[16px] font-black text-orange-600 dark:text-orange-400 tabular-nums">৳{totalRefund.toFixed(2)}</span>
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <CustomButton variant="danger" className="flex-1" onClick={onClose}>
                Cancel
              </CustomButton>
              <CustomButton
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleReturn}
                disabled={totalRefund === 0}
              >
                Process Return
              </CustomButton>
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
      size="xl"
      darkMode={darkMode}
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <CustomTabs
          tabs={[
            { id: "view", label: `View Customers (${customers.length})`, icon: <User size={14} /> },
            { id: "add", label: "Add New Customer", icon: <Plus size={14} /> },
          ]}
          activeTab={tab}
          onChange={(t) => setTab(t as "view" | "add")}
          themeColor="teal"
          darkMode={darkMode}
        />

        {tab === "view" ? (
          <div className="space-y-3">
            {/* Search Input */}
            <CustomInput
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer by name, phone or address..."
              leftIcon={<Search size={15} className="text-[#00796b]" />}
              themeColor="teal"
              darkMode={darkMode}
              rounded="xl"
              className="text-xs h-9.5"
            />

            {/* Customers List */}
            <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {/* Walk-in default item */}
              <div
                onClick={() => handleSelect("")}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition select-none",
                  !selectedCustomerId
                    ? "border-[#00897b] dark:border-teal-500 bg-[#e0f2f1]/80 dark:bg-teal-950/70 ring-2 ring-[#00897b]/20 dark:ring-teal-500/30 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl font-black text-xs transition",
                    !selectedCustomerId
                      ? "bg-[#00796b] text-white shadow-2xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  )}>
                    W
                  </div>
                  <div>
                    <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-slate-100">Walk-in Customer</h4>
                    <p className={cn("text-[11px] font-medium", !selectedCustomerId ? "text-[#00695c] dark:text-teal-300" : "text-slate-400 dark:text-slate-500")}>
                      Default generic sale
                    </p>
                  </div>
                </div>
                {!selectedCustomerId ? (
                  <span className="px-2.5 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-[#00897b] text-white shadow-2xs">
                    SELECTED
                  </span>
                ) : (
                  <CustomButton variant="outline" size="xs" themeColor="teal">Select</CustomButton>
                )}
              </div>

              {filteredCustomers.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <User size={28} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold">No customers found</p>
                  <CustomButton
                    variant="ghost"
                    size="xs"
                    onClick={() => setTab("add")}
                    className="mt-2 text-xs font-bold text-[#00796b] hover:underline"
                  >
                    + Add "{search}" as new customer
                  </CustomButton>
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
                        "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition select-none",
                        isSelected
                          ? "border-[#00897b] dark:border-teal-500 bg-[#e0f2f1]/80 dark:bg-teal-950/70 ring-2 ring-[#00897b]/20 dark:ring-teal-500/30 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div className={cn(
                          "flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl font-black text-xs transition",
                          isSelected
                            ? "bg-[#00796b] text-white shadow-2xs"
                            : "bg-[#e0f2f1] dark:bg-teal-950/60 text-[#00796b] dark:text-teal-400 border border-teal-200/80 dark:border-teal-800"
                        )}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-slate-100 truncate">{c.name}</h4>
                          <div className={cn("flex flex-wrap items-center gap-3 text-[11px] font-medium mt-0.5", isSelected ? "text-[#00695c] dark:text-teal-300" : "text-slate-500 dark:text-slate-400")}>
                            {c.phone && (
                              <span className="flex items-center gap-1">
                                <Phone size={11} className={isSelected ? "text-[#00796b] dark:text-teal-400" : "text-slate-400"} /> {c.phone}
                              </span>
                            )}
                            {c.address && (
                              <span className="flex items-center gap-1 truncate max-w-[220px]">
                                <MapPin size={11} className={isSelected ? "text-[#00796b] dark:text-teal-400" : "text-slate-400"} /> {c.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="px-2.5 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-[#00897b] text-white shadow-2xs shrink-0">
                          SELECTED
                        </span>
                      ) : (
                        <CustomButton
                          variant="outline"
                          size="xs"
                          themeColor="teal"
                          onClick={(e) => { e.stopPropagation(); handleSelect(c.id); }}
                          className="shrink-0"
                        >
                          Select
                        </CustomButton>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium">
                Showing {filteredCustomers.length + 1} registered entries
              </p>
              <CustomButton variant="danger" size="sm" onClick={onClose}>
                Close
              </CustomButton>
            </div>
          </div>
        ) : (
          /* Add Form */
          <div className="space-y-3.5">
            <div>
              <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">Full Name *</label>
              <CustomInput
                leftIcon={<User size={14} className="text-[#00796b]" />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Customer full name"
                themeColor="teal"
                darkMode={darkMode}
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
              <CustomInput
                type="tel"
                leftIcon={<Phone size={14} className="text-[#00796b]" />}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                themeColor="teal"
                darkMode={darkMode}
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">Email (optional)</label>
              <CustomInput
                type="email"
                leftIcon={<Mail size={14} className="text-[#00796b]" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                themeColor="teal"
                darkMode={darkMode}
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">Address (optional)</label>
              <CustomTextarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House, Road, Area, City..."
                darkMode={darkMode}
              />
            </div>
            <div className="flex gap-2.5 pt-2">
              <CustomButton
                variant="outline"
                className="flex-1"
                onClick={() => setTab("view")}
                darkMode={darkMode}
              >
                Back to Directory
              </CustomButton>
              <CustomButton
                variant="danger"
                onClick={onClose}
                darkMode={darkMode}
              >
                Cancel
              </CustomButton>
              <CustomButton
                themeColor="teal"
                className="flex-1"
                onClick={handleSave}
                disabled={!name.trim()}
                darkMode={darkMode}
              >
                Save & Select Customer
              </CustomButton>
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
  darkMode?: boolean;
}

export function HardwareSettingsModal({
  open,
  onClose,
  config,
  onSaveConfig,
  darkMode,
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

  const items: { key: keyof HardwareConfig; label: string; desc: string; IconComp: React.ElementType }[] = [
    { key: "receiptPrinter", label: "Thermal Receipt Printer", desc: "80mm / 58mm ESC/POS thermal receipt printer", IconComp: Printer },
    { key: "cashDrawer", label: "Cash Drawer", desc: "Automatic RJ11/RJ12 drawer kick on sale completion", IconComp: Archive },
    { key: "barcodeScanner", label: "Barcode Scanner", desc: "1D / 2D USB & Bluetooth handheld barcode reader", IconComp: ScanBarcode },
    // Kitchen Printer omitted as explicitly requested by user
    { key: "cardTerminal", label: "Card Terminal", desc: "Integrated credit/debit card POS payment terminal", IconComp: CreditCard },
    { key: "customerDisplay", label: "Customer Display", desc: "Secondary pole or monitor display facing customer", IconComp: Monitor },
  ];

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Hardware Settings"
      subtitle="Configure connected POS peripherals and devices"
      icon={<Sliders size={20} />}
      size="2xl"
      themeColor="teal"
      darkMode={darkMode}
    >
      <div className="space-y-4">
        {/* Hardware Items List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          {items.map(({ key, label, desc, IconComp }) => {
            const enabled = draft[key];
            return (
              <div
                key={key}
                onClick={() => toggle(key)}
                className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition cursor-pointer select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                      enabled
                        ? "bg-teal-50 dark:bg-teal-950/60 text-[#00796b] dark:text-teal-400 border border-teal-200/90 dark:border-teal-800 shadow-2xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
                    )}
                  >
                    <IconComp size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                      {label}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border",
                          enabled
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", enabled ? "bg-emerald-500" : "bg-slate-400")} />
                        {enabled ? "Enabled" : "Disabled"}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                        {desc}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Toggle Switch */}
                <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                  <CustomSwitch
                    checked={enabled}
                    onChange={() => toggle(key)}
                    themeColor="teal"
                    size="md"
                    id={`hw-switch-${key}`}
                    aria-label={`Toggle ${label}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Alert Box */}
        <div className="rounded-sm bg-teal-50/90 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 p-3.5 sm:p-4 flex items-start gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/60 text-[#00796b] dark:text-teal-300 shrink-0 mt-0.5">
            <Info size={16} />
          </div>
          <div className="text-[12px] leading-relaxed text-teal-950 dark:text-teal-200 font-medium">
            <span className="font-bold text-[#00796b] dark:text-teal-300">Hardware Driver Integration:</span> Full hardware activation requires SDK/driver integration. UI is ready — connect ESC/POS, Bluetooth or USB packages in the backend to activate.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <CustomButton
            variant="danger"
            onClick={onClose}
          >
            Close
          </CustomButton>
          <CustomButton
            themeColor="teal"
            className="flex items-center gap-2"
            onClick={handleSave}
          >
            <Save size={15} />
            Save Settings
          </CustomButton>
        </div>
      </div>
    </CustomModal>
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
  darkMode?: boolean;
}

export function NotificationDropdown({
  open,
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll,
  onDismiss,
  darkMode,
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
      className={cn(
        "absolute right-0 top-full z-50 mt-1.5 w-84 rounded-sm border shadow-2xl overflow-hidden",
        darkMode ? "border-slate-800 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-800"
      )}
    >
      <div className={cn(
        "flex items-center justify-between border-b px-4 py-3",
        darkMode ? "border-slate-800 bg-slate-800/80" : "border-slate-100 bg-slate-50/80"
      )}>
        <div className="flex items-center gap-2">
          <h3 className={cn("text-[13px] font-black", darkMode ? "text-slate-100" : "text-slate-800")}>Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-500">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {unreadCount > 0 && (
            <CustomButton
              variant="ghost"
              size="xs"
              onClick={onMarkAllRead}
              className="text-[10.5px] font-bold text-[#00796b] dark:text-teal-400 hover:underline !p-0 h-auto"
            >
              Mark read
            </CustomButton>
          )}
          {notifications.length > 0 && (
            <CustomButton
              variant="ghost"
              size="xs"
              onClick={onClearAll}
              className="text-[10.5px] font-bold text-slate-400 hover:text-slate-300 !p-0 h-auto"
            >
              Clear
            </CustomButton>
          )}
        </div>
      </div>
      <div className={cn("max-h-80 overflow-y-auto divide-y", darkMode ? "divide-slate-800" : "divide-slate-100")}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Bell size={28} className={cn("mb-2", darkMode ? "text-slate-700" : "text-slate-300")} />
            <p className="text-[12px] font-semibold">No notifications</p>
            <p className="text-[10.5px] text-slate-400">All alerts cleared</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "group flex items-start gap-3 px-4 py-3 transition relative",
                darkMode ? "hover:bg-slate-800/60" : "hover:bg-slate-50",
                !n.read ? (darkMode ? "bg-teal-950/30" : "bg-teal-50/40") : "",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-0.5",
                  n.type === "warning" ? (darkMode ? "bg-amber-950/60 text-amber-400" : "bg-amber-100 text-amber-600") :
                    n.type === "error" ? (darkMode ? "bg-rose-950/60 text-rose-400" : "bg-rose-100 text-rose-600") :
                    n.type === "info" ? (darkMode ? "bg-teal-950/60 text-teal-400" : "bg-teal-100 text-[#00796b]") :
                      (darkMode ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-100 text-emerald-600"),
                )}
              >
                {n.type === "warning" || n.type === "error" ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <p className={cn("text-[11.5px] font-extrabold", darkMode ? "text-slate-100" : "text-slate-800")}>{n.title}</p>
                <p className={cn("text-[10.5px] font-medium truncate", darkMode ? "text-slate-400" : "text-slate-500")}>{n.body}</p>
                <p className="mt-0.5 text-[9.5px] font-semibold text-slate-400">{n.time}</p>
              </div>
              {onDismiss && (
                <CustomButton
                  variant="ghost"
                  size="xs"
                  onClick={() => onDismiss(n.id)}
                  className="opacity-0 group-hover:opacity-100 !p-1 text-slate-400 hover:text-rose-500 transition absolute right-2 top-2 h-auto"
                  title="Dismiss"
                  icon={<X size={12} />}
                />
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
  darkMode?: boolean;
}

export function ProfileDropdown({
  open,
  onClose,
  cashierName,
  terminalName = "PC-01",
  onOpenSettings,
  darkMode,
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
      className={cn(
        "absolute right-0 top-full z-50 mt-1.5 w-56 rounded-sm border shadow-xl overflow-hidden",
        darkMode ? "border-slate-800 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-800"
      )}
    >
      <div className={cn("border-b px-4 py-3", darkMode ? "border-slate-800 bg-slate-800/80" : "border-slate-100 bg-slate-50/50")}>
        <p className={cn("text-[12px] font-extrabold", darkMode ? "text-slate-100" : "text-slate-800")}>{cashierName}</p>
        <p className="text-[10px] font-semibold text-slate-400">Terminal: {terminalName}</p>
      </div>
      <div className="py-1">
        <CustomButton
          variant="ghost"
          fullWidth
          size="sm"
          onClick={() => {
            onClose();
            onOpenSettings?.();
          }}
          className={cn("!justify-start gap-2.5 px-4 py-2 text-[12px] font-semibold transition h-auto rounded-none", darkMode ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-700 hover:bg-slate-50")}
          icon={<Settings size={14} className={darkMode ? "text-slate-400" : "text-slate-600"} />}
        >
          Hardware Settings
        </CustomButton>
        <CustomButton
          variant="ghost"
          fullWidth
          size="sm"
          className={cn("!justify-start gap-2.5 px-4 py-2 text-[12px] font-semibold transition h-auto rounded-none", darkMode ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-700 hover:bg-slate-50")}
          icon={<Clock size={14} className={darkMode ? "text-slate-400" : "text-slate-600"} />}
        >
          Shift Report
        </CustomButton>
        <CustomButton
          variant="ghost"
          fullWidth
          size="sm"
          className={cn("!justify-start gap-2.5 px-4 py-2 text-[12px] font-semibold transition h-auto rounded-none", darkMode ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-700 hover:bg-slate-50")}
          icon={<Package size={14} className={darkMode ? "text-slate-400" : "text-slate-600"} />}
        >
          Stock Check
        </CustomButton>
        <div className={cn("border-t mt-1 pt-1", darkMode ? "border-slate-800" : "border-slate-100")}>
          <CustomButton
            variant="ghost"
            fullWidth
            size="sm"
            className={cn("!justify-start gap-2.5 px-4 py-2 text-[12px] font-semibold transition h-auto rounded-none", darkMode ? "text-rose-400 hover:bg-rose-950/40" : "text-rose-600 hover:bg-rose-50")}
            icon={<LogOut size={14} />}
          >
            Logout
          </CustomButton>
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
  darkMode?: boolean;
}

export function AdvancedFilterPanel({ open, onClose, onApply, darkMode }: AdvancedFilterPanelProps) {
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
      subtitle="Filter medicines by price, brand, and stock status"
      Icon={SlidersHorizontal}
      iconColor="text-[#00796b]"
      iconBg="bg-teal-50"
      size="xl"
      darkMode={darkMode}
    >
      <div className="space-y-4">
        <div>
          <label className="block mb-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">Price Range (৳)</label>
          <div className="flex items-center gap-2">
            <CustomInput
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min"
              themeColor="teal"
              containerClassName="flex-1"
              darkMode={darkMode}
            />
            <span className="text-slate-400 font-semibold">—</span>
            <CustomInput
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max"
              themeColor="teal"
              containerClassName="flex-1"
              darkMode={darkMode}
            />
          </div>
        </div>
        <div>
          <label className="block mb-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">Brand / Manufacturer</label>
          <CustomInput
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Square, Beximco, ACI..."
            themeColor="teal"
            darkMode={darkMode}
          />
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-3">
          <CustomCheckbox
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            label="In Stock Only"
            themeColor="teal"
          />
        </div>
        <div className="flex gap-2.5 pt-2">
          <CustomButton variant="danger" className="flex-1" onClick={handleReset}>
            Reset
          </CustomButton>
          <CustomButton themeColor="teal" className="flex-1" onClick={handleApply}>
            Apply Filters
          </CustomButton>
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
  darkMode?: boolean;
}

export function GenericAlternativesModal({
  open,
  onClose,
  originalProduct,
  alternatives,
  onSelectAlternative,
  darkMode,
}: GenericAlternativesModalProps) {
  if (!open) return null;

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Generic Alternatives"
      subtitle={originalProduct ? `For: ${originalProduct.name} · Original: ৳${originalProduct.sellingPrice.toFixed(2)}` : "Find cheaper generic substitutes for any medicine"}
      icon={<Leaf size={20} />}
      size="3xl"
      themeColor="teal"
      darkMode={darkMode}
    >
      <div className="space-y-3">
        {/* Info strip */}
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 rounded-sm px-4 py-2.5">
          <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-[11.5px] font-semibold text-emerald-700 dark:text-emerald-300">
            Generic medicines have the exact same active ingredient and dosage strength but cost significantly less.
          </p>
        </div>

        {/* Alternatives List */}
        <div className="max-h-[420px] overflow-y-auto space-y-2.5 pr-1">
          {!originalProduct ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
              <Leaf size={36} className="mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">No medicine currently selected</p>
              <p className="text-[11px] mt-1 text-slate-400 dark:text-slate-500 max-w-xs text-center">
                Click any medicine from the product grid or use the leaf icon in the cart to view its cheaper generic alternatives.
              </p>
            </div>
          ) : alternatives.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
              <Leaf size={36} className="mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">No generic alternatives found</p>
              <p className="text-[11px] mt-1 text-slate-400 dark:text-slate-500">No lower-cost generic matches found in stock for {originalProduct.name}</p>
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
                  className="flex items-center gap-3.5 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850/80 p-3.5 hover:border-[#00796b]/40 dark:hover:border-teal-500/50 hover:bg-[#f0faf8] dark:hover:bg-slate-800 transition shadow-2xs"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#00796b] dark:text-teal-400">
                    <Leaf size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100 truncate">{alt.name}</p>
                    <p className="text-[10.5px] font-medium text-slate-400 dark:text-slate-400 truncate">
                      {alt.unit || "Generic"} · Stock: {alt.stockQty ?? 0}
                    </p>
                    {isCheaper && (
                      <p className="mt-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Saves ৳{saving.toFixed(2)} ({savingPct}% cheaper)
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[15px] font-black text-[#00796b] dark:text-teal-400 tabular-nums">
                      ৳{alt.sellingPrice.toFixed(2)}
                    </p>
                    {isCheaper && (
                      <div className="mt-0.5">
                        <CustomBadge tone="green">
                          -{savingPct}% OFF
                        </CustomBadge>
                      </div>
                    )}
                  </div>
                  <CustomButton
                    themeColor="teal"
                    size="xs"
                    onClick={() => {
                      onSelectAlternative(alt);
                      onClose();
                    }}
                    disabled={(alt.stockQty ?? 0) <= 0}
                    className="ml-1 shrink-0 gap-1.5 shadow-sm"
                    icon={<Plus size={13} strokeWidth={2.8} />}
                  >
                    Add
                  </CustomButton>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between">
          <p className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500">
            Consult a pharmacist before switching to a generic medicine.
          </p>
          <CustomButton
            variant="danger"
            size="sm"
            onClick={onClose}
          >
            Close
          </CustomButton>
        </div>
      </div>
    </CustomModal>
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
          "relative w-full max-w-[700px] rounded-sm shadow-2xl overflow-hidden border animate-in zoom-in-95 fade-in duration-200",
          darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}
      >
        {/* ── HEADER ── */}
        <div className={cn(
          "flex items-center justify-between px-6 py-4 border-b",
          darkMode ? "border-slate-800 bg-slate-900" : "border-teal-100 bg-gradient-to-r from-teal-50/80 via-white to-teal-50/50"
        )}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-[#00796b] text-white shadow-md">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="12" height="5" rx="1" />
                <path d="M5 9h14l1 9H4l1-9z" />
                <path d="M8 12h.01M12 12h.01M16 12h.01" strokeWidth="2.5" />
              </svg>
            </div>
            <div>
              <h2 className={cn("text-[17px] font-black", textPrimary)}>Checkout & Payment</h2>
              <p className={cn("text-[11px] font-semibold", textSub)}>
                {itemCount} item{itemCount !== 1 ? "s" : ""} · {customerName} · {cashierName}
              </p>
            </div>
          </div>
          <CustomButton
            variant="danger"
            size="xs"
            onClick={onClose}
            className="h-8 w-8 !p-0 rounded-sm border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition flex items-center justify-center cursor-pointer shadow-2xs"
            aria-label="Close checkout"
          >
            <X size={16} />
          </CustomButton>
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
              <span>
                VAT {subtotal > 0 && vatAmount > 0 ? `(${Math.round((vatAmount / Math.max(1, subtotal - (totalDiscount || 0))) * 100)}%)` : "(15%)"}
              </span>
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
                  <CustomButton
                    key={id}
                    size="xs"
                    variant={active ? "primary" : "outline"}
                    themeColor={active ? "teal" : undefined}
                    onClick={() => onChangePayMethod(id)}
                    title={desc}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 rounded-sm py-3.5 text-center transition h-auto",
                      !active && (darkMode ? "border-slate-700 bg-slate-800 text-slate-400 hover:border-teal-700 hover:bg-slate-700 hover:text-teal-300" : "border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:bg-teal-50 hover:text-[#00796b]")
                    )}
                  >
                    {icon}
                    <span className="text-[10px] font-black">{label}</span>
                  </CustomButton>
                );
              })}
            </div>
          </div>

          {/* CASH TENDERING */}
          {payMethod === "CASH" && (
            <div className={cn("rounded-sm border p-4 space-y-3", cardBg)}>
              <div className="flex items-center justify-between">
                <p className={cn("text-[10px] font-black uppercase tracking-widest", textSub)}>Cash Tendered</p>
                <CustomButton
                  variant="ghost"
                  size="xs"
                  onClick={setExact}
                  className="text-[11px] font-bold text-[#00796b] hover:underline !p-0 h-auto"
                >
                  Exact Amount
                </CustomButton>
              </div>

              {/* Amount input */}
              <div className="relative">
                <CustomInput
                  ref={refInput}
                  type="number"
                  min="0"
                  step="1"
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
                  placeholder="0.00"
                  leftIcon={<span className={cn("text-[16px] font-black", darkMode ? "text-slate-400" : "text-[#00796b]")}>৳</span>}
                  rightIcon={isExact ? (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Exact
                    </span>
                  ) : undefined}
                  darkMode={darkMode}
                  themeColor="teal"
                  rounded="xl"
                  className={cn(
                    "py-3 text-[24px] font-black text-right tabular-nums",
                    isExact ? "border-emerald-400 focus:ring-emerald-200" : ""
                  )}
                />
              </div>

              {/* Quick denomination grid */}
              <div className="grid grid-cols-4 gap-1.5">
                {CASH_DENOMINATIONS.map((d) => (
                  <CustomButton
                    key={d}
                    size="xs"
                    variant="outline"
                    onClick={() => addDenom(d)}
                    className={cn(
                      "rounded-xl py-2.5 text-[11.5px] font-black transition",
                      darkMode
                        ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-teal-900/60 hover:border-teal-800 hover:text-teal-300"
                        : "border-slate-200 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50 hover:text-[#00796b]"
                    )}
                  >
                    +৳{d >= 1000 ? `${d / 1000}k` : d}
                  </CustomButton>
                ))}
              </div>

              {/* Change to return */}
              <div className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3 transition",
                change > 0
                  ? (darkMode ? "border-emerald-800 bg-emerald-950/60" : "border-emerald-300 bg-emerald-50")
                  : darkMode
                    ? "border-slate-700 bg-slate-800/60"
                    : "border-slate-200 bg-white"
              )}>
                <span className={cn(
                  "text-[12.5px] font-bold",
                  change > 0 ? (darkMode ? "text-emerald-400" : "text-emerald-700") : textSub
                )}>
                  Change to Return
                </span>
                <span className={cn(
                  "text-[20px] font-black tabular-nums",
                  change > 0 ? (darkMode ? "text-emerald-400" : "text-emerald-600") : darkMode ? "text-slate-500" : "text-slate-400"
                )}>
                  ৳{change.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* NON-CASH NOTICE */}
          {payMethod !== "CASH" && (
            <div className={cn(
              "flex items-center gap-3 rounded-sm border px-4 py-3.5",
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
            <CustomSwitch
              checked={printReceipt}
              onChange={(checked) => setPrintReceipt(checked)}
              themeColor="teal"
              size="sm"
              aria-label="Print receipt toggle"
            />
          </div>
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className={cn(
          "flex items-center gap-2.5 px-5 py-4 border-t",
          darkMode ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white"
        )}>
          <CustomButton
            variant="danger"
            onClick={onClose}
            className="rounded-sm px-5 py-3 text-[13px] font-bold h-auto"
          >
            Cancel
          </CustomButton>

          <CustomButton
            themeColor="teal"
            disabled={!canPay || !!submitting}
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-between rounded-sm px-5 py-3 text-white shadow-lg transition-all active:scale-[0.99] h-auto"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} strokeWidth={2.5} />
              <span className="text-[14px] font-black">
                {submitting ? "Processing..." : "Complete Payment"}
              </span>
            </div>
            <span className="text-[18px] font-black tabular-nums">৳{total.toFixed(2)}</span>
          </CustomButton>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// HELD BILLS MODAL
// ═══════════════════════════════════════════
interface HeldBill {
  id: string;
  items: RxCartItem[];
  discountTotal: number;
  note: string;
  createdAt?: number;
}

interface PharmacyPOSHeldBillsModalProps {
  open: boolean;
  onClose: () => void;
  heldBills: HeldBill[];
  onResume: (id: string) => void;
  onRemove: (id: string) => void;
  darkMode?: boolean;
}

export function PharmacyPOSHeldBillsModal({
  open,
  onClose,
  heldBills,
  onResume,
  onRemove,
  darkMode,
}: PharmacyPOSHeldBillsModalProps) {
  if (!open) return null;

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Held Bills"
      subtitle={`${heldBills.length} ${heldBills.length === 1 ? "bill" : "bills"} on hold`}
      icon={<RotateCcw size={18} />}
      size="3xl"
      themeColor="teal"
      darkMode={darkMode}
    >
      <div className="space-y-4">
        <div className={cn("max-h-[460px] overflow-y-auto space-y-3 pr-1", darkMode ? "bg-slate-950" : "bg-slate-50/50")}>
          {heldBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <Archive size={48} className={cn("mb-4 opacity-50", darkMode ? "text-slate-600" : "text-slate-300")} />
              <h3 className={cn("text-base font-bold", darkMode ? "text-slate-300" : "text-slate-600")}>No held bills</h3>
              <p className={cn("text-xs mt-1", darkMode ? "text-slate-500" : "text-slate-400")}>
                Use F6 or the Hold Bill button to suspend a transaction.
              </p>
            </div>
          ) : (
            heldBills.map((bill) => {
              const totalItems = bill.items.reduce((sum, item) => sum + item.qty, 0);
              const subtotal = bill.items.reduce((sum, item) => sum + item.lineTotal, 0);
              const total = subtotal - (bill.discountTotal || 0);

              return (
                <div
                  key={bill.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-sm border p-4 transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between",
                    darkMode ? "border-slate-800 bg-slate-900 hover:border-teal-700" : "border-slate-200 bg-white hover:border-teal-300"
                  )}
                >
                  {/* Bill Info */}
                  <div className="flex flex-1 items-start gap-4">
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold",
                      darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"
                    )}>
                      #{bill.id.slice(0, 4)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h4 className={cn("text-sm font-extrabold", darkMode ? "text-slate-200" : "text-slate-800")}>
                          #{bill.id.slice(0, 8).toUpperCase()}
                        </h4>
                        <CustomBadge tone="primary">
                          {totalItems} items
                        </CustomBadge>
                      </div>
                      <p className={cn("text-xs font-semibold mt-0.5", darkMode ? "text-slate-400" : "text-slate-500")}>
                        {bill.createdAt ? new Date(bill.createdAt).toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" }) : "N/A"}
                        {bill.note ? ` • ${bill.note}` : ""}
                      </p>
                      <p className={cn("text-sm font-black mt-2", darkMode ? "text-teal-400" : "text-[#00796b]")}>
                        ৳{total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2 border-t pt-3 sm:border-0 sm:pt-0">
                    <CustomButton
                      variant="danger"
                      size="sm"
                      onClick={() => onRemove(bill.id)}
                    >
                      <Trash2 size={14} className="sm:mr-1.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </CustomButton>
                    <CustomButton
                      themeColor="teal"
                      size="sm"
                      onClick={() => onResume(bill.id)}
                    >
                      <RotateCcw size={14} className="mr-1.5" />
                      Recall Bill
                    </CustomButton>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <CustomButton variant="danger" size="sm" onClick={onClose}>
            Close
          </CustomButton>
        </div>
      </div>
    </CustomModal>
  );
}
