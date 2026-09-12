"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Tag,
  Plus,
  Percent,
  DollarSign,
  Gift,
  Clock,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  Sparkles,
  Search,
  RefreshCw,
  Ticket,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Calculator,
  LayoutGrid,
  List,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ShoppingBag,
  Store,
  Info,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomTable, CustomStatCard, ConfirmModal } from "@/components/custom";
import { money } from "@/lib/format";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  type: string;
  value: number | string;
  priority: number;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
  usageLimit: number | null;
  usageCount?: number;
  min_qty?: number | null;
  minQty?: number | null;
  minAmount?: number | null;
  maxDiscount?: number | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: { products: number; coupons: number };
}

const PROMO_TYPES = [
  { value: "PERCENTAGE", label: "Percentage Discount (%)", icon: Percent, desc: "Deduct a percentage from order or items" },
  { value: "FIXED", label: "Fixed Amount Off (৳)", icon: DollarSign, desc: "Deduct a specific fixed currency amount" },
  { value: "BUY_X_GET_Y", label: "Buy X Get Y (BOGO)", icon: Gift, desc: "Reward bulk purchase with free or discounted items" },
  { value: "HAPPY_HOUR", label: "Happy Hour Timing", icon: Clock, desc: "Time-windowed recurring or special event discount" },
  { value: "BUNDLE", label: "Product Bundle Deal", icon: Layers, desc: "Special pricing for packaged product combinations" },
  { value: "COMBO", label: "Combo Meal / Deal", icon: Tag, desc: "Combo menu or multi-category pairing" },
  { value: "CATEGORY_DISCOUNT", label: "Category-Wide Discount", icon: ShoppingBag, desc: "Applies to all products in selected category" },
  { value: "PRODUCT_DISCOUNT", label: "Product Specific Discount", icon: Tag, desc: "Direct discount on specific SKUs" },
];

const PRESET_PROMOTIONS = [
  { name: "Summer Flash Sale 20%", type: "PERCENTAGE", value: "20", desc: "Limited time 20% discount on entire cart", priority: "10", minAmount: "500", maxDiscount: "1000" },
  { name: "Flat ৳500 Off", type: "FIXED", value: "500", desc: "Flat ৳500 rebate on orders above ৳3,000", priority: "5", minAmount: "3000", maxDiscount: "" },
  { name: "Weekend Happy Hour 15%", type: "HAPPY_HOUR", value: "15", desc: "15% off during peak afternoon/evening hours", priority: "8", minAmount: "", maxDiscount: "500" },
  { name: "Buy 2 Get 1 Free", type: "BUY_X_GET_Y", value: "100", desc: "Buy 2 items and get 1 free (100% off 3rd item)", priority: "12", minAmount: "", maxDiscount: "" },
  { name: "Clearance Special 30%", type: "PERCENTAGE", value: "30", desc: "Stock clearance discount for eligible items", priority: "15", minAmount: "1000", maxDiscount: "2500" },
];

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"campaigns" | "sandbox">("campaigns");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filter & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Promotion[] }>("/promotions?limit=100");
      setPromos(res.data || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load promotions", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  // Toggle Active Status
  const handleToggleStatus = async (promo: Promotion) => {
    try {
      await api.put(`/promotions/${promo.id}`, { isActive: !promo.isActive });
      showToast(`Promotion "${promo.name}" is now ${!promo.isActive ? "Active" : "Inactive"}`);
      loadPromotions();
    } catch (err: any) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  // Delete Promotion
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.del(`/promotions/${deleteConfirm.id}`);
      showToast(`Promotion "${deleteConfirm.name}" deleted successfully`);
      setDeleteConfirm(null);
      loadPromotions();
    } catch (err: any) {
      showToast(err.message || "Failed to delete promotion", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Promotions
  const filteredPromos = useMemo(() => {
    return promos.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(search.toLowerCase()) ||
        p.type.toLowerCase().includes(search.toLowerCase());

      const today = new Date().toISOString().split("T")[0];
      const isExpired = p.validTo && p.validTo < today;

      let matchesStatus = true;
      if (statusFilter === "ACTIVE") matchesStatus = p.isActive && !isExpired;
      else if (statusFilter === "INACTIVE") matchesStatus = !p.isActive;
      else if (statusFilter === "EXPIRED") matchesStatus = !!isExpired;

      const matchesType = typeFilter === "ALL" || p.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [promos, search, statusFilter, typeFilter]);

  // Derived Stats
  const activeCount = promos.filter((p) => {
    const today = new Date().toISOString().split("T")[0];
    const isExpired = p.validTo && p.validTo < today;
    return p.isActive && !isExpired;
  }).length;

  const totalCouponsCount = promos.reduce((acc, p) => acc + (p._count?.coupons || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl transition-all duration-300 ${
            toast.type === "success"
              ? "bg-emerald-950 text-emerald-100 border border-emerald-700"
              : "bg-red-950 text-red-100 border border-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="text-red-400" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 p-7 text-white shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-12 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-rose-300 ring-1 ring-white/15 backdrop-blur-md mb-2">
              <Zap size={13} className="text-amber-400" />
              Promotions & Discount Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Promotions & Campaign Management
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-300 leading-relaxed">
              Create dynamic discounts, percentage rebates, BOGO bundles, and happy hour specials to boost customer conversion and average order value.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/promotions/coupons"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20 active:scale-95"
            >
              <Ticket size={16} className="text-rose-300" /> Manage Coupons
            </Link>
            <button
              onClick={() => { setEditPromo(null); setShowModal(true); }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:brightness-110 active:scale-95"
            >
              <Plus size={16} /> New Promotion
            </button>
            <button
              onClick={() => loadPromotions()}
              className="rounded-2xl bg-white/5 p-2.5 text-slate-300 ring-1 ring-white/10 transition hover:bg-white/15 hover:text-white"
              title="Refresh Campaigns"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-5 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10 backdrop-blur-sm">
            <p className="text-xs text-slate-400">Active Campaigns</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{activeCount}</span>
              <span className="text-xs text-slate-400">of {promos.length} total</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10 backdrop-blur-sm">
            <p className="text-xs text-slate-400">Total Campaigns</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-rose-300">{promos.length}</span>
              <span className="text-xs text-slate-400">configured</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10 backdrop-blur-sm">
            <p className="text-xs text-slate-400">Linked Coupons</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-amber-300">{totalCouponsCount}</span>
              <span className="text-xs text-slate-400">promo codes</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10 backdrop-blur-sm">
            <p className="text-xs text-slate-400">Checkout Stacking</p>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold text-emerald-300">Priority Ranked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Top Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1.5 rounded-2xl bg-slate-100 p-1.5 shadow-inner">
          <button
            onClick={() => setTab("campaigns")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === "campaigns"
                ? "bg-white text-slate-900 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Tag size={16} className={tab === "campaigns" ? "text-rose-600" : "text-slate-400"} />
            <span>All Campaigns</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">
              {promos.length}
            </span>
          </button>
          <button
            onClick={() => setTab("sandbox")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === "sandbox"
                ? "bg-white text-slate-900 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calculator size={16} className={tab === "sandbox" ? "text-amber-600" : "text-slate-400"} />
            <span>Discount Sandbox & Simulator</span>
          </button>
        </div>

        {tab === "campaigns" && (
          <div className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 text-slate-600 transition ${
                viewMode === "grid" ? "bg-white text-slate-950 shadow-xs" : "hover:text-slate-900"
              }`}
              title="Grid Cards"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-lg p-1.5 text-slate-600 transition ${
                viewMode === "table" ? "bg-white text-slate-950 shadow-xs" : "hover:text-slate-900"
              }`}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ──────────────── TAB: CAMPAIGNS ──────────────── */}
      {tab === "campaigns" && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search promotions by name or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-rose-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Campaigns</option>
                <option value="INACTIVE">Inactive Campaigns</option>
                <option value="EXPIRED">Expired Campaigns</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-rose-500 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                {PROMO_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-rose-600" />
            </div>
          ) : filteredPromos.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                <Tag size={28} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">No promotions found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                {search || statusFilter !== "ALL" || typeFilter !== "ALL"
                  ? "Try clearing your filters or changing your search terms."
                  : "Launch your first promotional discount campaign to boost customer checkouts."}
              </p>
              <button
                onClick={() => { setEditPromo(null); setShowModal(true); }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-rose-700"
              >
                <Plus size={14} /> Create First Promotion
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* Card Grid View */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPromos.map((p) => {
                const typeObj = PROMO_TYPES.find((t) => t.value === p.type);
                const Icon = typeObj?.icon || Tag;
                const today = new Date().toISOString().split("T")[0];
                const isExpired = p.validTo && p.validTo < today;

                return (
                  <div
                    key={p.id}
                    className={`group relative flex flex-col justify-between rounded-3xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      !p.isActive || isExpired
                        ? "border-slate-200 opacity-80"
                        : "border-slate-200/90 hover:border-rose-300"
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 group-hover:scale-105 transition">
                            <Icon size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">
                              {p.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 mt-1">
                              {typeObj?.label || p.type.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditPromo(p); setShowModal(true); }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="Edit Promotion"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: p.id, name: p.name })}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete Promotion"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      {p.description && (
                        <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      )}

                      {/* Value & Discount Details */}
                      <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 border border-slate-100 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Discount Value:</span>
                          <span className="font-bold text-rose-700 text-sm">
                            {p.type.includes("PERCENTAGE") || p.type === "HAPPY_HOUR"
                              ? `${p.value}% OFF`
                              : `৳${p.value} OFF`}
                          </span>
                        </div>
                        {p.minAmount ? (
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Min. Order Spend:</span>
                            <span className="font-semibold">{money(p.minAmount)}</span>
                          </div>
                        ) : null}
                        {p.maxDiscount ? (
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Max. Discount Cap:</span>
                            <span className="font-semibold">{money(p.maxDiscount)}</span>
                          </div>
                        ) : null}
                        {p.priority > 0 ? (
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Stacking Priority:</span>
                            <span className="font-semibold">{p.priority}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Footer / Validity & Status */}
                    <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                      <div className="text-slate-500 flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400" />
                        <span>
                          {p.validTo ? `Ends ${p.validTo}` : "Ongoing / No Expiry"}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleStatus(p)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition hover:opacity-80 ${
                          isExpired
                            ? "bg-slate-100 text-slate-500"
                            : p.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isExpired ? "bg-slate-400" : p.isActive ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        {isExpired ? "Expired" : p.isActive ? "Active" : "Inactive"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CustomTable
                columns={[
                  {
                    key: "name",
                    header: "Promotion Campaign",
                    render: (r: Promotion) => (
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{r.name}</p>
                        {r.description && (
                          <p className="text-xs text-slate-400 line-clamp-1">{r.description}</p>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "type",
                    header: "Type",
                    render: (r: Promotion) => (
                      <span className="inline-flex rounded-lg bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-100">
                        {r.type.replace(/_/g, " ")}
                      </span>
                    ),
                  },
                  {
                    key: "value",
                    header: "Discount Value",
                    align: "right",
                    render: (r: Promotion) => (
                      <span className="font-bold text-rose-700 tabular-nums">
                        {r.type.includes("PERCENTAGE") || r.type === "HAPPY_HOUR"
                          ? `${r.value}%`
                          : money(Number(r.value) || 0)}
                      </span>
                    ),
                  },
                  {
                    key: "minAmount",
                    header: "Min Spend",
                    align: "right",
                    render: (r: Promotion) => (
                      <span className="text-slate-600 text-xs">
                        {r.minAmount ? money(r.minAmount) : "—"}
                      </span>
                    ),
                  },
                  {
                    key: "validity",
                    header: "Valid Period",
                    render: (r: Promotion) => (
                      <span className="text-xs text-slate-500">
                        {r.validFrom || "Now"} → {r.validTo || "Open"}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (r: Promotion) => (
                      <button
                        onClick={() => handleToggleStatus(r)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold transition hover:opacity-80 ${
                          r.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${r.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {r.isActive ? "Active" : "Inactive"}
                      </button>
                    ),
                  },
                  {
                    key: "actions",
                    header: "Actions",
                    align: "right",
                    render: (r: Promotion) => (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditPromo(r); setShowModal(true); }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ id: r.id, name: r.name })}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={filteredPromos}
                rowKey={(r: Promotion) => r.id}
                loading={loading}
                emptyIcon={Tag}
                emptyMessage="No promotions match your filter."
              />
            </div>
          )}
        </div>
      )}

      {/* ──────────────── TAB: SANDBOX SIMULATOR ──────────────── */}
      {tab === "sandbox" && (
        <PromotionSimulator promos={promos} />
      )}

      {/* ──────────────── MODALS ──────────────── */}
      {showModal && (
        <PromotionFormModal
          promo={editPromo}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            showToast(editPromo ? "Promotion updated successfully" : "Promotion created successfully");
            loadPromotions();
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Promotion"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? Linked customer checkouts will no longer receive this discount.`}
        type="DANGER"
        confirmText="Delete Promotion"
        loading={deleting}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// PROMOTION FORM MODAL
// ────────────────────────────────────────────────────────────

function PromotionFormModal({
  promo,
  onClose,
  onSaved,
}: {
  promo: Promotion | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: promo?.name || "",
    type: promo?.type || "PERCENTAGE",
    value: promo?.value?.toString() || "20",
    description: promo?.description || "",
    priority: promo?.priority?.toString() || "0",
    minQty: promo?.min_qty?.toString() || promo?.minQty?.toString() || "",
    minAmount: promo?.minAmount?.toString() || "",
    maxDiscount: promo?.maxDiscount?.toString() || "",
    usageLimit: promo?.usageLimit?.toString() || "",
    validFrom: promo?.validFrom ? promo.validFrom.split("T")[0] : "",
    validTo: promo?.validTo ? promo.validTo.split("T")[0] : "",
    isActive: promo?.isActive ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const applyPreset = (preset: (typeof PRESET_PROMOTIONS)[0]) => {
    setForm((prev) => ({
      ...prev,
      name: preset.name,
      type: preset.type,
      value: preset.value,
      description: preset.desc,
      priority: preset.priority,
      minAmount: preset.minAmount,
      maxDiscount: preset.maxDiscount,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.value) {
      setError("Please provide a promotion name and discount value.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        value: parseFloat(form.value) || 0,
        description: form.description.trim() || null,
        priority: parseInt(form.priority) || 0,
        minQty: form.minQty ? parseInt(form.minQty) : null,
        minAmount: form.minAmount ? parseFloat(form.minAmount) : null,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        validFrom: form.validFrom ? form.validFrom : null,
        validTo: form.validTo ? form.validTo : null,
        isActive: form.isActive,
      };

      if (promo) {
        await api.put(`/promotions/${promo.id}`, payload);
      } else {
        await api.post("/promotions", payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to save promotion.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {promo ? "Edit Promotion Campaign" : "New Promotion Campaign"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Set discount value, qualification thresholds, and duration.
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <XCircle size={20} />
          </button>
        </div>

        {/* Presets for New Promos */}
        {!promo && (
          <div className="mt-4 rounded-2xl bg-rose-50/60 border border-rose-200/60 p-3.5">
            <p className="text-xs font-bold text-rose-900 flex items-center gap-1 mb-2">
              <Sparkles size={13} className="text-rose-600" /> Fast Setup Presets:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PROMOTIONS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-rose-900 border border-rose-300/80 shadow-xs hover:bg-rose-100 active:scale-95 transition"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Promotion Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              placeholder="e.g. Eid Mega Sale 20%"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Promotion Type *
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
              >
                {PROMO_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Discount Value *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 pl-3.5 pr-8 py-2 text-sm font-semibold focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {form.type.includes("PERCENTAGE") || form.type === "HAPPY_HOUR" ? "%" : "৳"}
                </span>
              </div>
            </div>
          </div>

          {/* Spend Thresholds */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Minimum Spend (৳)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.minAmount}
                onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-rose-500 focus:outline-none"
                placeholder="Optional minimum spend"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Max Discount Cap (৳)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.maxDiscount}
                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-rose-500 focus:outline-none"
                placeholder="Max cap amount"
              />
            </div>
          </div>

          {/* Validity Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Valid From
              </label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Valid To (Expiry)
              </label>
              <input
                type="date"
                value={form.validTo}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority Rank (Higher = Applied First)
              </label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-rose-500 focus:outline-none"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Usage Limit (Total checkouts)
              </label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-rose-500 focus:outline-none"
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Cashier Note
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-rose-500 focus:outline-none"
              placeholder="e.g. Valid on all bakery items during happy hour"
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-sm font-semibold text-slate-800">
                Active Campaign (Ready for POS checkout)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-rose-700 active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving..." : promo ? "Update Promotion" : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// PROMOTION SIMULATOR SANDBOX
// ────────────────────────────────────────────────────────────

function PromotionSimulator({ promos }: { promos: Promotion[] }) {
  const [subtotal, setSubtotal] = useState("2500");
  const [selectedPromoId, setSelectedPromoId] = useState(promos[0]?.id || "");

  const calculation = useMemo(() => {
    const numSubtotal = parseFloat(subtotal) || 0;
    const promo = promos.find((p) => p.id === selectedPromoId);
    if (!promo || numSubtotal <= 0) {
      return { discount: 0, finalTotal: numSubtotal, applied: false, reason: "No promo selected" };
    }

    if (promo.minAmount && numSubtotal < promo.minAmount) {
      return {
        discount: 0,
        finalTotal: numSubtotal,
        applied: false,
        reason: `Requires minimum spend of ${money(promo.minAmount)} (Current: ${money(numSubtotal)})`,
      };
    }

    const val = Number(promo.value) || 0;
    let disc = 0;
    if (promo.type.includes("PERCENTAGE") || promo.type === "HAPPY_HOUR") {
      disc = (numSubtotal * val) / 100;
      if (promo.maxDiscount && disc > promo.maxDiscount) {
        disc = promo.maxDiscount;
      }
    } else {
      disc = val;
      if (disc > numSubtotal) disc = numSubtotal;
    }

    return {
      discount: Math.round(disc * 100) / 100,
      finalTotal: Math.round((numSubtotal - disc) * 100) / 100,
      applied: true,
      reason: "Discount applied successfully",
      promo,
    };
  }, [subtotal, selectedPromoId, promos]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-6 rounded-3xl bg-white p-6 shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <Calculator size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Campaign Discount Sandbox</h3>
            <p className="text-xs text-slate-500">
              Test how discount percentages, minimum order caps, and ceilings behave.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Simulated Cart Subtotal (৳)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={subtotal}
                onChange={(e) => setSubtotal(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 pl-4 pr-12 py-3 text-lg font-bold text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 tabular-nums"
                placeholder="2500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                BDT
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Promotion to Test
            </label>
            <select
              value={selectedPromoId}
              onChange={(e) => setSelectedPromoId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-rose-500 focus:outline-none"
            >
              {promos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type} - {p.value}{p.type.includes("PERCENTAGE") ? "%" : "৳"})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="lg:col-span-6 space-y-4">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-rose-950 to-slate-950 p-6 text-white shadow-xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-rose-900/80 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-300">
                Simulation Result
              </p>
              <h4 className="text-xl font-bold text-white mt-0.5">
                {calculation.applied ? "Promo Applied" : "Promo Condition Not Met"}
              </h4>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                calculation.applied
                  ? "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/30"
                  : "bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/30"
              }`}
            >
              {calculation.applied ? "Eligible" : "Ineligible"}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Original Cart Subtotal</span>
              <span className="font-semibold text-white tabular-nums">{money(parseFloat(subtotal) || 0)}</span>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Discount Savings</span>
              <span className="font-bold text-rose-400 tabular-nums">-{money(calculation.discount)}</span>
            </div>

            <div className="border-t border-rose-900/80 pt-4 flex items-center justify-between">
              <div>
                <span className="text-base font-bold text-white">Customer Payable Total</span>
                <span className="block text-xs text-slate-400">{calculation.reason}</span>
              </div>
              <span className="text-2xl font-black text-white tabular-nums">
                {money(calculation.finalTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
