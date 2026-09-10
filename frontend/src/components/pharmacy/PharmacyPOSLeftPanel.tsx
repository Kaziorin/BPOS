"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ScanLine,
  Plus,
  Moon,
  LayoutGrid,
  Syringe,
  Pill,
  Sparkles,
  Droplets,
  Activity,
  Heart,
  Wind,
  Eye,
  Package,
  User,
  Flame,
  AlertTriangle,
  Clock,
  FilePlus2,
  Filter,
  RefreshCcw,
  Stethoscope,
  FileText,
  RotateCcw,
  Camera,
  Calendar,
  Leaf,
  Briefcase,
  SlidersHorizontal,
  ArrowRight,
  History,
  Archive,
} from "lucide-react";
import type { RegisterProduct } from "@/lib/catalog";
import { cn } from "@/lib/cn";

export type PharmaCat =
  | "All"
  | "Antibiotics"
  | "Pain Relief"
  | "Vitamins & Suppl."
  | "Skin Care"
  | "Diabetes Care"
  | "Cardiovascular"
  | "Gastrointestinal"
  | "Respiratory"
  | "Eye & Ear Care"
  | "Others";

export type GridFilter =
  | "All Medicines"
  | "Popular"
  | "Low Stock"
  | "Expiring Soon"
  | "Prescription Required"
  | "Generic Available";

export type SortBy = "name-asc" | "name-desc" | "price-asc" | "price-desc" | "stock";

export const CATEGORIES: {
  id: PharmaCat;
  label: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}[] = [
  { id: "All", label: "All", Icon: LayoutGrid, iconBg: "bg-teal-700", iconColor: "text-white" },
  { id: "Antibiotics", label: "Antibiotics", Icon: Syringe, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  { id: "Pain Relief", label: "Pain Relief", Icon: Pill, iconBg: "bg-orange-100", iconColor: "text-orange-500" },
  { id: "Vitamins & Suppl.", label: "Vitamins & Suppl.", Icon: Sparkles, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  { id: "Skin Care", label: "Skin Care", Icon: Droplets, iconBg: "bg-rose-100", iconColor: "text-rose-500" },
  { id: "Diabetes Care", label: "Diabetes Care", Icon: Activity, iconBg: "bg-sky-100", iconColor: "text-sky-600" },
  { id: "Cardiovascular", label: "Cardiovascular", Icon: Heart, iconBg: "bg-red-100", iconColor: "text-red-500" },
  { id: "Gastrointestinal", label: "Gastrointestinal", Icon: Activity, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  { id: "Respiratory", label: "Respiratory", Icon: Wind, iconBg: "bg-blue-100", iconColor: "text-blue-500" },
  { id: "Eye & Ear Care", label: "Eye & Ear Care", Icon: Eye, iconBg: "bg-slate-100", iconColor: "text-slate-600" },
  { id: "Others", label: "Others", Icon: Package, iconBg: "bg-yellow-100", iconColor: "text-yellow-600" },
];

export const GRID_FILTERS: { id: GridFilter; label: string; Icon?: React.ElementType; tone?: string }[] = [
  { id: "All Medicines", label: "All Medicines", Icon: Pill },
  { id: "Popular", label: "Popular" },
  { id: "Low Stock", label: "Low Stock", Icon: AlertTriangle, tone: "text-amber-500" },
  { id: "Expiring Soon", label: "Expiring Soon", Icon: Calendar, tone: "text-[#ef4444]" },
  { id: "Prescription Required", label: "Prescription Required", Icon: Briefcase, tone: "text-[#9333ea]" },
  { id: "Generic Available", label: "Generic Available", Icon: Leaf, tone: "text-[#10b981]" },
];

export const BOTTOM_ACTIONS = [
  { id: "rx", label: "Prescription", sub: "View / Attach Rx", Icon: FilePlus2, color: "text-purple-600", bg: "bg-purple-50" },
  { id: "doctor", label: "Doctor", sub: "Add Doctor", Icon: Stethoscope, color: "text-sky-600", bg: "bg-sky-50" },
  { id: "refill", label: "Refill", sub: "Quick Refill", Icon: RefreshCcw, color: "text-amber-600", bg: "bg-amber-50" },
  { id: "loyalty", label: "Loyalty", sub: "Add Points", Icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
  { id: "note", label: "Note", sub: "Add Note", Icon: FileText, color: "text-teal-600", bg: "bg-teal-50" },
  { id: "return", label: "Return", sub: "Quick Return", Icon: RotateCcw, color: "text-orange-500", bg: "bg-orange-50" },
  { id: "sales-history", label: "Sales History", sub: "View History", Icon: History, color: "text-indigo-600", bg: "bg-indigo-50" },
  { id: "open-drawer", label: "Open Drawer", sub: "Cash Drawer", Icon: Archive, color: "text-emerald-600", bg: "bg-emerald-50" },
];

function MedCrossLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full bg-[#00897b] text-white shadow-xs"
      style={{ width: size, height: size }}
    >
      <Plus size={size * 0.58} strokeWidth={3} />
    </div>
  );
}

function ProductThumb({ product }: { product: Pick<RegisterProduct, "name" | "imageUrl"> }) {
  if (product.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.imageUrl}
        alt={product.name}
        className="h-20 w-full rounded-xl object-cover bg-slate-50 border border-slate-100"
      />
    );
  }
  return (
    <div className="flex h-20 w-full items-center justify-center rounded-xl bg-slate-100 border border-slate-100">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/80 text-slate-400">
        <Pill size={22} />
      </div>
    </div>
  );
}

interface PharmacyPOSLeftPanelProps {
  search: string;
  setSearch: (val: string) => void;
  searchRef?: React.RefObject<HTMLInputElement | null>;
  category: PharmaCat;
  setCategory: (cat: PharmaCat) => void;
  catSearch: string;
  setCatSearch: (val: string) => void;
  gridFilter: GridFilter;
  setGridFilter: (filter: GridFilter) => void;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  products: RegisterProduct[];
  onTapProduct: (p: RegisterProduct) => void;
  onQuickAction?: (actionId: string) => void;
  onCustomerClick?: () => void;
  handleSearchKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function PharmacyPOSLeftPanel({
  search,
  setSearch,
  searchRef,
  category,
  setCategory,
  catSearch,
  setCatSearch,
  gridFilter,
  setGridFilter,
  sortBy,
  setSortBy,
  products,
  onTapProduct,
  onQuickAction,
  onCustomerClick,
  handleSearchKeyDown,
}: PharmacyPOSLeftPanelProps) {
  const visibleCategories = useMemo(() => {
    const q = catSearch.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter((c) => c.label.toLowerCase().includes(q));
  }, [catSearch]);

  return (
    <div className="flex w-full flex-col h-full overflow-hidden bg-white">
      {/* ═══ LEFT PANEL HEADER ═══ */}
      <header className="flex flex-none items-center gap-2.5 border-b border-slate-200/80 bg-white px-4 py-2.5">
        <Link href="/pharmacy" className="flex shrink-0 items-center gap-2.5">
          <MedCrossLogo size={40} />
          <div className="leading-tight">
            <h1 className="text-[17px] font-bold text-[#00897b] tracking-tight">BPOS</h1>
            <p className="text-[10px] font-semibold text-slate-500">Pharmacy</p>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="relative mx-1 flex-1 min-w-[220px]">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3.5 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search medicine by name, brand or barcode..."
              className="w-full rounded-full border border-slate-200/90 bg-white pl-9 pr-9 py-2 text-[12px] font-normal text-slate-800 placeholder:text-slate-400 transition focus:border-[#00897b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00897b]/20 shadow-2xs"
            />
            <ScanLine size={16} className="absolute right-3.5 text-slate-400 cursor-pointer hover:text-[#00897b]" />
          </div>
        </div>

        {/* Top Action Pills */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {[
            { id: "scan-rx", label: "Scan Rx", Icon: Camera },
            { id: "scan-barcode", label: "Scan Barcode", Icon: ScanLine },
            { id: "quick-refill", label: "Quick Refill", Icon: RefreshCcw },
            { id: "add-medicine", label: "Add Medicine", Icon: Plus },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onQuickAction?.(id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#e0f2f1] px-3.5 py-1.5 text-[11.5px] font-semibold text-[#00796b] transition hover:bg-[#b2dfdb]"
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200 mx-1 shrink-0 hidden sm:block" />

        {/* Moon icon */}
        <button
          type="button"
          className="rounded-full p-2 text-slate-600 hover:bg-slate-100 transition shrink-0"
          title="Toggle theme"
        >
          <Moon size={17} />
        </button>
      </header>

      {/* ═══ MAIN LEFT BODY (Sidebar + Grid) ═══ */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* CATEGORY SIDEBAR */}
        <aside className="flex w-[190px] shrink-0 flex-col border-r border-slate-200 bg-white xl:w-[210px]">
          {/* Category search input */}
          <div className="p-2.5 border-b border-slate-100">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-slate-400" />
              <input
                type="text"
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                placeholder="Search category..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-7 pr-2.5 py-1.5 text-[11px] font-medium text-slate-700 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Categories List */}
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {visibleCategories.map(({ id, label, Icon, iconBg, iconColor }) => {
              const active = category === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCategory(id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[12px] font-bold transition",
                    active
                      ? "bg-[#00796b] text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition",
                      active ? "bg-white/20 text-white" : `${iconBg} ${iconColor}`,
                    )}
                  >
                    <Icon size={13} strokeWidth={2.2} />
                  </div>
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Customer Pill (NO top border line, matched height) */}
          <div className="p-3">
            <button
              type="button"
              onClick={onCustomerClick}
              className="flex w-full h-[68px] items-center gap-2.5 rounded-2xl border border-teal-200/70 bg-[#e8f4f8] px-3 py-2 text-left transition hover:border-teal-300 shadow-2xs"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#00796b] text-white shadow-xs">
                <User size={18} />
              </div>
              <div className="leading-tight min-w-0">
                <p className="text-[12.5px] font-bold text-slate-800">Customer</p>
                <p className="text-[10px] font-medium text-slate-400 truncate">Add / View Customer</p>
              </div>
            </button>
          </div>
        </aside>

        {/* PRODUCTS GRID AREA */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-50/50">
          {/* Grid Filter Bar */}
          <div className="flex flex-none flex-wrap items-center gap-2 border-b border-slate-200/80 bg-white px-3 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {GRID_FILTERS.map(({ id, label, Icon, tone }) => {
                const active = gridFilter === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setGridFilter(id)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
                      active
                        ? "bg-[#00695c] text-white shadow-2xs"
                        : "bg-[#f2f4f7] text-slate-700 hover:bg-slate-200/80",
                    )}
                  >
                    {Icon && <Icon size={14} className={active ? "text-white" : tone || "text-slate-500"} />}
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown & Filter Icon */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <span className="text-[12px] font-medium text-slate-400 hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-800 focus:border-[#00897b] focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="price-asc">Price Low to High</option>
                <option value="price-desc">Price High to Low</option>
                <option value="stock">Stock Level</option>
              </select>

              <button
                type="button"
                className="rounded-xl border border-slate-200/90 bg-white p-2 text-slate-600 hover:bg-slate-50 transition shadow-2xs"
                title="Filter options"
              >
                <SlidersHorizontal size={14} />
              </button>
            </div>
          </div>

          {/* Product Grid Scrollable Area */}
          <div className={cn("min-h-0 flex-1 overflow-y-auto p-3 space-y-3", products.length === 0 && "flex flex-col items-center justify-center")}>
            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {products.map((p) => {
                  const outOfStock = (p.stockQty ?? 0) <= 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => !outOfStock && onTapProduct(p)}
                      className={cn(
                        "group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-2.5 text-left shadow-xs transition hover:border-teal-400 hover:shadow-md cursor-pointer",
                        outOfStock && "opacity-40 pointer-events-none bg-slate-50/50",
                      )}
                    >
                      <div>
                        {/* Product Thumbnail */}
                        <div className="mb-2 overflow-hidden rounded-xl">
                          <ProductThumb product={p} />
                          {outOfStock && (
                            <div className="absolute top-2 left-2 z-10 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">
                              Out of stock
                            </div>
                          )}
                        </div>

                        {/* Product Title */}
                        <h3 className="line-clamp-1 text-[12.5px] font-extrabold text-slate-800 group-hover:text-[#00796b] transition">
                          {p.name}
                        </h3>

                        {/* Unit & Dosage */}
                        <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                          {p.unit || "Tablet • 10mg"}
                        </p>

                        {/* Stock Info */}
                        <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                          Stock: <span className="text-slate-600">{p.stockQty ?? 0}</span>
                        </p>
                      </div>

                      {/* Price & Add Button */}
                      <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-slate-50">
                        <span className="text-[13.5px] font-black text-[#00796b] tabular-nums">
                          ৳ {p.sellingPrice.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!outOfStock) onTapProduct(p);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00796b] text-white shadow-xs transition hover:bg-[#005a50] hover:scale-105 active:scale-95"
                        >
                          <Plus size={15} strokeWidth={2.8} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
                  <Pill size={40} className="text-slate-200" />
                </div>
                <p className="text-base font-bold text-slate-600">No medicines found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px] text-center font-medium leading-relaxed uppercase tracking-wider">Try adjusting your search or category filter</p>
              </div>
            )}
          </div>

          {/* FIXED GENERIC BANNER (Anchored right above 6 action buttons) */}
          <div className="flex-none px-3 pb-2 pt-1 bg-slate-50/50">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#f0faf8] border border-[#cceee7] px-4 py-2.5 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#10b981] shadow-2xs">
                  <Leaf size={18} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-slate-800">Generic Alternative Available</h4>
                  <p className="text-[11px] font-medium text-slate-400">This medicine has 3 generic alternatives</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGridFilter("Generic Available")}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#00695c] px-4 py-1.5 text-[12px] font-bold text-white transition hover:bg-[#005247] shadow-2xs shrink-0"
              >
                <span>View Alternatives</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Bottom Action Grid (6 Buttons) */}
          <div className="flex-none border-t border-slate-200 bg-white p-3">
            <div className="grid grid-cols-8 gap-2">
              {BOTTOM_ACTIONS.map(({ id, label, sub, Icon, color, bg }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onQuickAction?.(id)}
                  className="flex h-[68px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-1 py-2 text-center shadow-2xs transition hover:border-teal-300 hover:shadow-xs group"
                >
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-xl transition mb-1", bg)}>
                    <Icon size={15} className={color} />
                  </div>
                  <span className="text-[11px] font-black text-slate-800 leading-tight group-hover:text-[#00796b]">
                    {label}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 leading-tight mt-0.5">
                    {sub}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
