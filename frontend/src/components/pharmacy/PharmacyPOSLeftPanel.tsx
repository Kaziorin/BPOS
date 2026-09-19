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
  Settings,
  Maximize,
  Minimize,
} from "lucide-react";
import type { RegisterProduct } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { PharmacyWaveRibbons } from "./PharmacyWaveRibbons";
import {
  CustomBadge,
  CustomButton,
  CustomInput,
  CustomSelect,
} from "@/components/custom";

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
    { id: "All", label: "All", Icon: LayoutGrid, iconBg: "bg-brand-dark", iconColor: "text-white" },
    { id: "Antibiotics", label: "Antibiotics", Icon: Syringe, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
    { id: "Pain Relief", label: "Pain Relief", Icon: Pill, iconBg: "bg-orange-100", iconColor: "text-orange-500" },
    { id: "Vitamins & Suppl.", label: "Vitamins & Suppl.", Icon: Sparkles, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
    { id: "Skin Care", label: "Skin Care", Icon: Droplets, iconBg: "bg-rose-100", iconColor: "text-rose-500" },
    { id: "Diabetes Care", label: "Diabetes Care", Icon: Activity, iconBg: "bg-brand-50", iconColor: "text-brand-dark" },
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
  { id: "rx", label: "Prescription", sub: "Attach Rx", Icon: FilePlus2, color: "text-purple-600", bg: "bg-purple-50" },
  { id: "doctor", label: "Doctor", sub: "Add Doctor", Icon: Stethoscope, color: "text-[#00796b]", bg: "bg-brand-50" },
  { id: "refill", label: "Refill", sub: "Quick Refill", Icon: RefreshCcw, color: "text-amber-600", bg: "bg-amber-50" },
  { id: "loyalty", label: "Loyalty", sub: "Points", Icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
  { id: "note", label: "Note", sub: "Sales Note", Icon: FileText, color: "text-brand-primary", bg: "bg-brand-50" },
  { id: "return", label: "Return", sub: "Quick Return", Icon: RotateCcw, color: "text-orange-500", bg: "bg-orange-50" },
  { id: "sales-history", label: "History", sub: "Sales Log", Icon: History, color: "text-indigo-600", bg: "bg-indigo-50" },
  { id: "open-drawer", label: "Drawer", sub: "Cash Drawer", Icon: Archive, color: "text-emerald-600", bg: "bg-emerald-50" },
];

function MedCrossLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-sm bg-[#00897b] text-white shadow-xs"
      style={{ width: size, height: size }}
    >
      <Plus size={size * 0.58} strokeWidth={3} />
    </div>
  );
}

function ProductThumb({ product, darkMode }: { product: Pick<RegisterProduct, "name" | "imageUrl">; darkMode?: boolean }) {
  if (product.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.imageUrl}
        alt={product.name}
        className={cn(
          "h-20 w-full rounded-sm object-cover border transition-transform duration-200 group-hover:scale-105",
          darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100"
        )}
        loading="lazy"
      />
    );
  }
  return (
    <div className={cn(
      "flex h-20 w-full items-center justify-center rounded-sm border transition",
      darkMode ? "bg-slate-800/80 border-slate-700/80" : "bg-slate-100 border-slate-100"
    )}>
      <div className={cn(
        "flex h-9 w-9 items-center justify-center rounded-sm transition",
        darkMode ? "bg-slate-700/80 text-brand-primary" : "bg-slate-200/80 text-brand-dark"
      )}>
        <Pill size={20} />
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
  onAdvancedFilter?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  rxMode?: boolean;
  onOpenHardwareSettings?: () => void;
  /** The last product added to cart — used to find generic alternatives */
  lastAddedProduct?: RegisterProduct | null;
  /** Generic alternatives for lastAddedProduct */
  genericAlternatives?: RegisterProduct[];
  /** Called when user clicks "View Alternatives" */
  onViewAlternatives?: () => void;
  /** Fullscreen toggle */
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
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
  onAdvancedFilter,
  darkMode,
  onToggleDarkMode,
  rxMode,
  onOpenHardwareSettings,
  lastAddedProduct,
  genericAlternatives = [],
  onViewAlternatives,
  onToggleFullscreen,
  isFullscreen,
}: PharmacyPOSLeftPanelProps) {
  const visibleCategories = useMemo(() => {
    const q = catSearch.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter((c) => c.label.toLowerCase().includes(q));
  }, [catSearch]);

  return (
    <div className={cn("flex w-full flex-col h-full overflow-hidden bg-white", darkMode && "bg-slate-900 text-slate-100")}>
      {/* ═══ LEFT PANEL HEADER (Silky Teal Wave Gradient) ═══ */}
      <header
        className="relative z-20 flex flex-none items-center gap-2.5 px-4 py-2.5 select-none text-white shadow-xs"
        style={{
          background: darkMode
            ? "linear-gradient(115deg, #022c22 0%, #004d40 28%, #00695c 55%, #0f766e 85%, #14b8a6 100%)"
            : "linear-gradient(115deg, #004D40 0%, #00695C 26%, #00796B 48%, #00897B 70%, #14B8A6 90%, #5EEAD4 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <PharmacyWaveRibbons />
        </div>

        <div className="relative z-10 flex items-center gap-2.5 shrink-0">
          <Link href="/pharmacy" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-white/20 backdrop-blur-xs border border-white/30 text-white shadow-xs">
              <MedCrossLogo size={28} />
            </div>
            <div className="leading-tight text-white">
              <div className="flex items-center gap-1.5">
                <h1 className="text-[16px] font-black tracking-tight text-white drop-shadow-xs">BPOS</h1>
                <span className="rounded-xs bg-white/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white border border-white/30">
                  Rx POS
                </span>
              </div>
              <p className="text-[10px] font-medium text-white/90/90">Pharmacy Terminal</p>
            </div>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative z-10 mx-1 flex-1 min-w-[200px]">
          <CustomInput
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search medicine by name, generic, brand or barcode..."
            leftIcon={<Search size={15} className="text-slate-400" />}
            rightIcon={<ScanLine size={15} className="text-slate-400 cursor-pointer hover:text-[#00897b]" />}
            rounded="sm"
            themeColor="teal"
            className="text-[12px] h-9 shadow-xs font-medium bg-white text-gray-600 border-white/40 placeholder:text-slate-400 focus:bg-white"
          />
        </div>

        {/* Top Action Pills */}
        <div className="relative z-10 hidden lg:flex items-center gap-1.5 shrink-0">
          {[
            {
              id: "scan-rx",
              label: "Scan Rx",
              Icon: Camera,
              iconColor: "text-violet-600 dark:text-violet-400",
            },
            {
              id: "scan-barcode",
              label: "Scan Barcode",
              Icon: ScanLine,
              iconColor: "text-sky-600 dark:text-sky-400",
            },
            {
              id: "quick-refill",
              label: "Quick Refill",
              Icon: RefreshCcw,
              iconColor: "text-amber-600 dark:text-amber-400",
            },
          ].map(({ id, label, Icon, iconColor }) => (
            <button
              key={id}
              type="button"
              onClick={() => onQuickAction?.(id)}
              className={cn(
                "inline-flex items-center gap-1.5 h-8.5 px-3 rounded-sm text-[11.5px] font-bold border transition-all duration-150 cursor-pointer select-none active:scale-95 shadow-xs",
                darkMode
                  ? "bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-100"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-gray-600 hover:text-[#00796b]"
              )}
            >
              <Icon size={13.5} className={iconColor} strokeWidth={2.2} />
              <span>{label}</span>
            </button>
          ))}

          {/* Add Medicine (Primary High-Contrast Accent) */}
          <button
            type="button"
            onClick={() => onQuickAction?.("add-medicine")}
            className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-sm text-[11.5px] font-black border border-[#004d40] bg-[#004d40] hover:bg-[#00382e] text-white transition-all duration-150 cursor-pointer select-none active:scale-95 shadow-sm hover:brightness-105"
          >
            <Plus size={13.5} strokeWidth={3} className="text-brand-primary/60" />
            <span>Add Medicine</span>
          </button>
        </div>

        {/* Vertical Divider */}
        <div className="relative z-10 h-6 w-px mx-0.5 shrink-0 hidden sm:block bg-white/30" />

        {/* Moon icon */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className={cn(
            "relative z-10 rounded-sm h-8 w-8 !p-0 flex items-center justify-center shrink-0 border transition active:scale-95 cursor-pointer shadow-xs",
            darkMode
              ? "bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-yellow-300"
              : "bg-white hover:bg-slate-50 border-slate-200 text-gray-600 hover:text-[#00796b]"
          )}
          title="Toggle dark mode"
        >
          <Moon size={15} />
        </button>

        {/* Fullscreen toggle */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className={cn(
            "relative z-10 rounded-sm h-8 w-8 !p-0 flex items-center justify-center shrink-0 border transition active:scale-95 cursor-pointer shadow-xs",
            darkMode
              ? "bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-brand-primary/60"
              : "bg-white hover:bg-slate-50 border-slate-200 text-gray-600 hover:text-[#00796b]"
          )}
          title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
        >
          {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
        </button>
      </header>

      {/* ═══ MAIN LEFT BODY (Sidebar + Grid) ═══ */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* CATEGORY SIDEBAR */}
        <aside className={cn(
          "flex w-[190px] shrink-0 flex-col border-r xl:w-[210px] transition",
          darkMode ? "border-slate-800 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-gray-600"
        )}>
          {/* Category search input */}
          <div className={cn("p-2 border-b", darkMode ? "border-slate-800" : "border-slate-100")}>
            <CustomInput
              type="text"
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
              placeholder="Search category..."
              leftIcon={<Search size={13} className="text-slate-400" />}
              darkMode={darkMode}
              themeColor="teal"
              rounded="sm"
              className="text-[11px] h-8"
            />
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
                    "w-full flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-[12px] font-bold transition-all h-auto cursor-pointer select-none",
                    active
                      ? "bg-gradient-to-r from-[#00695c] to-[#00897b] text-white shadow-xs"
                      : darkMode
                        ? "text-slate-300 hover:bg-slate-800"
                        : "text-gray-600 hover:bg-slate-100"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-sm transition",
                      active
                        ? "bg-white/20 text-white"
                        : darkMode
                          ? "bg-slate-800 text-brand-primary"
                          : `${iconBg} ${iconColor}`,
                    )}
                  >
                    <Icon size={13} strokeWidth={2.2} />
                  </div>
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Customer Pill */}
          <div className="p-2 border-t mt-auto border-slate-100 dark:border-slate-800">
            <CustomButton
              variant={darkMode ? "secondary" : "outline"}
              onClick={onCustomerClick}
              className={cn(
                "!justify-start !flex-row w-full h-[58px] items-center gap-2.5 rounded-sm border px-3 py-2 text-left transition shadow-2xs",
                darkMode
                  ? "border-teal-900/60 bg-slate-800 hover:border-teal-700"
                  : "border-brand-border/70 bg-[#e8f4f8] hover:border-brand-border"
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[#00796b] text-white shadow-xs">
                <User size={16} />
              </div>
              <div className="leading-tight min-w-0 text-left">
                <p className={cn("text-[12.5px] font-bold", darkMode ? "text-slate-100" : "text-gray-600")}>Customer</p>
                <p className="text-[10px] font-medium text-slate-400 truncate">Add / View Customer</p>
              </div>
            </CustomButton>
          </div>
        </aside>

        {/* PRODUCTS GRID AREA */}
        <main className={cn(
          "flex min-w-0 flex-1 flex-col overflow-hidden transition",
          darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50/50 text-gray-600"
        )}>
          {/* Grid Filter Bar */}
          <div className={cn(
            "flex flex-none items-center justify-between gap-2 border-b px-3 py-1.5 transition",
            darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
          )}>
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {GRID_FILTERS.map(({ id, label, Icon, tone }) => {
                const active = gridFilter === id;
                return (
                  <CustomButton
                    key={id}
                    size="xs"
                    variant={active ? "primary" : "secondary"}
                    themeColor={active ? "teal" : undefined}
                    onClick={() => setGridFilter(id)}
                    className={cn(
                      "rounded-sm shrink-0 text-[11.5px] h-7.5 font-semibold gap-1 px-3",
                      !active && (darkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border-0" : "bg-[#f2f4f7] text-gray-600 hover:bg-slate-200/80 border-0")
                    )}
                  >
                    {Icon && <Icon size={12} className={active ? "text-white" : tone || (darkMode ? "text-slate-400" : "text-slate-500")} />}
                    {label}
                  </CustomButton>
                );
              })}
            </div>

            {/* Sort Dropdown & Filter Icon */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">Sort:</span>
              <div className="w-[130px]">
                <CustomSelect
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  darkMode={darkMode}
                  themeColor="teal"
                  className="text-[11.5px] py-0.5 h-7.5 rounded-sm"
                  options={[
                    { label: "Name A-Z", value: "name-asc" },
                    { label: "Name Z-A", value: "name-desc" },
                    { label: "Price Low-High", value: "price-asc" },
                    { label: "Price High-Low", value: "price-desc" },
                    { label: "Stock Level", value: "stock" },
                  ]}
                />
              </div>

              <CustomButton
                variant="outline"
                size="xs"
                themeColor="teal"
                onClick={onAdvancedFilter}
                className="h-7.5 w-7.5 !p-0 rounded-sm flex items-center justify-center shrink-0"
                title="Advanced filter"
              >
                <SlidersHorizontal size={14} />
              </CustomButton>
            </div>
          </div>

          {/* Product Grid Scrollable Area */}
          <div className={cn("min-h-0 flex-1 overflow-y-auto p-3 space-y-3", products.length === 0 && "flex flex-col items-center justify-center")}>
            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {products.map((p) => {
                  const outOfStock = (p.stockQty ?? 0) <= 0;
                  const isRx = /rx|prescription|antibiotic|amox|cipro|omeprazole|esomeprazole|respiratory|cardio/i.test(
                    `${p.categoryName || ""} ${p.name}`
                  );
                  return (
                    <div
                      key={p.id}
                      onClick={() => !outOfStock && onTapProduct(p)}
                      className={cn(
                        "group relative flex flex-col justify-between rounded-sm border p-2 text-left transition-all duration-150 cursor-pointer select-none",
                        darkMode
                          ? "border-slate-800/90 bg-slate-900 text-slate-100 hover:border-brand-primary/70 hover:shadow-xs"
                          : "border-slate-200/90 bg-white text-gray-600 hover:border-[#00796b]/60 hover:shadow-[0_2px_8px_rgba(0,121,107,0.08)]",
                        outOfStock && (darkMode ? "opacity-45 pointer-events-none bg-slate-900/60" : "opacity-45 pointer-events-none bg-slate-50/60"),
                      )}
                    >
                      <div>
                        {/* Product Thumbnail */}
                        <div className="relative mb-1.5 overflow-hidden rounded-sm">
                          <ProductThumb product={p} darkMode={darkMode} />
                          {outOfStock ? (
                            <span className="absolute top-1 left-1 z-10 rounded-xs bg-rose-600/90 px-1.5 py-0.5 text-[8.5px] font-bold text-white shadow-xs">
                              Out of stock
                            </span>
                          ) : rxMode && isRx ? (
                            <span className="absolute top-1 left-1 z-10 rounded-xs bg-[#00796b] px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-white shadow-xs">
                              Rx
                            </span>
                          ) : null}
                        </div>

                        {/* Product Title */}
                        <h3
                          className={cn(
                            "line-clamp-1 text-[11.5px] font-bold leading-snug tracking-tight transition-colors",
                            darkMode ? "text-slate-100 group-hover:text-brand-primary" : "text-gray-600 group-hover:text-[#00796b]"
                          )}
                          title={p.name}
                        >
                          {p.name}
                        </h3>

                        {/* Generic Name */}
                        {p.genericName ? (
                          <p className="mt-0.5 line-clamp-1 text-[9.5px] font-medium text-brand-dark dark:text-brand-primary" title={p.genericName}>
                            <span className="opacity-75 font-normal">Gen:</span> {p.genericName}
                          </p>
                        ) : (
                          <p className="mt-0.5 line-clamp-1 text-[9.5px] text-transparent select-none">
                            -
                          </p>
                        )}

                        {/* Unit / Dosage & Stock */}
                        <div className="mt-1 flex items-center justify-between gap-1 text-[9.5px] leading-tight">
                          <span className="truncate font-medium text-slate-400 dark:text-slate-400" title={p.unit || "Tablet • 10mg"}>
                            {p.unit || "Tablet • 10mg"}
                          </span>
                          <span className="shrink-0 font-medium text-slate-400 dark:text-slate-400">
                            Stock:{" "}
                            <span className={cn(
                              "font-bold",
                              outOfStock
                                ? "text-rose-500"
                                : (p.stockQty ?? 0) <= 5
                                ? "text-amber-600 dark:text-amber-400"
                                : darkMode ? "text-slate-200" : "text-gray-600"
                            )}>
                              {p.stockQty ?? 0}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Price & Add Button */}
                      <div className={cn(
                        "mt-1.5 flex items-center justify-between pt-1.5 border-t",
                        darkMode ? "border-slate-800" : "border-slate-100"
                      )}>
                        <div className="flex items-baseline">
                          <span className="text-[10.5px] font-semibold text-[#00796b] dark:text-brand-primary mr-0.5">৳</span>
                          <span className="text-[13px] font-black text-[#00796b] dark:text-brand-primary/60 tabular-nums tracking-tight">
                            {p.sellingPrice.toFixed(2)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!outOfStock) onTapProduct(p);
                          }}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs bg-[#00796b] text-white shadow-2xs transition-all hover:bg-[#00695c] hover:scale-105 active:scale-95 cursor-pointer"
                          title="Add to cart"
                        >
                          <Plus size={13} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 animate-in fade-in zoom-in-95 duration-300">
                <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-4 border shadow-inner", darkMode ? "bg-slate-900 border-slate-800 text-gray-600" : "bg-slate-50 border-slate-100 text-slate-200")}>
                  <Pill size={40} />
                </div>
                <p className={cn("text-base font-bold", darkMode ? "text-slate-300" : "text-slate-600")}>No medicines found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px] text-center font-medium leading-relaxed uppercase tracking-wider">Try adjusting your search or category filter</p>
              </div>
            )}
          </div>

          {/* GENERIC ALTERNATIVES BANNER (Silky Teal Wave Gradient) */}
          <div className="flex-none px-3 pb-2 pt-1">
            <div
              className="relative flex items-center justify-between gap-3 rounded-sm p-3 shadow-md select-none overflow-hidden text-white"
              style={{
                background: darkMode
                  ? "linear-gradient(115deg, #022c22 0%, #004d40 30%, #00695c 65%, #0f766e 100%)"
                  : "linear-gradient(115deg, #004D40 0%, #00695C 26%, #00796B 48%, #00897B 70%, #14B8A6 90%, #5EEAD4 100%)",
              }}
            >
              <PharmacyWaveRibbons />
              <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-sm bg-white/20 backdrop-blur-xs border border-white/30 text-white shadow-xs">
                  <Leaf size={16} />
                </div>
                <div className="min-w-0 text-white">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[12.5px] font-bold truncate leading-snug text-white drop-shadow-xs">
                      Generic Alternative Available
                    </h4>
                    <span className="hidden sm:inline-flex items-center rounded-xs bg-white/25 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-white border border-white/30">
                      Save Cost
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-white/90/90 truncate leading-snug">
                    {lastAddedProduct && genericAlternatives.length > 0 ? (
                      <>
                        <span className="font-bold text-white underline decoration-teal-300">{lastAddedProduct.name}</span>
                        {" "}has {genericAlternatives.length} cheaper generic{genericAlternatives.length > 1 ? "s" : ""}
                      </>
                    ) : (
                      "Compare & dispense cost-effective generic substitutes"
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onViewAlternatives}
                className="relative z-10 inline-flex items-center gap-1.5 rounded-sm bg-white hover:bg-brand-50 px-3.5 py-1.5 text-[11.5px] font-bold text-[#00695c] transition-all hover:brightness-105 active:scale-95 shadow-md shrink-0 cursor-pointer"
              >
                <span>View Alternatives</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Bottom Action Grid (8 Buttons) */}
          <div className={cn(
            "flex-none border-t p-2.5 transition",
            darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
          )}>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {BOTTOM_ACTIONS.map(({ id, label, sub, Icon, color, bg }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onQuickAction?.(id)}
                  className={cn(
                    "flex flex-col items-center justify-between rounded-sm border p-1.5 text-center shadow-2xs transition group cursor-pointer select-none min-h-[64px] h-[64px] w-full min-w-0",
                    darkMode
                      ? "border-slate-800 bg-slate-800/90 text-slate-100 hover:border-brand-primary hover:bg-slate-700/80"
                      : "border-slate-200 bg-white text-gray-600 hover:border-brand-border hover:bg-brand-50/20"
                  )}
                >
                  <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-sm transition", darkMode ? "bg-slate-700" : bg)}>
                    <Icon size={14} className={darkMode ? "text-brand-primary" : color} />
                  </div>
                  <div className="flex flex-col items-center justify-center w-full min-w-0 leading-none">
                    <span className={cn(
                      "text-[11px] font-bold leading-tight truncate w-full block text-center px-0.5",
                      darkMode ? "text-slate-100 group-hover:text-brand-primary" : "text-gray-600 group-hover:text-[#00796b]"
                    )}>
                      {label}
                    </span>
                    <span className="text-[9.5px] font-medium text-slate-400 leading-tight truncate w-full block text-center px-0.5 mt-0.5">
                      {sub}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
