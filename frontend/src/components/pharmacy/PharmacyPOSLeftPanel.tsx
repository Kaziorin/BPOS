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
    { id: "All", label: "All", Icon: LayoutGrid, iconBg: "bg-teal-700", iconColor: "text-white" },
    { id: "Antibiotics", label: "Antibiotics", Icon: Syringe, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
    { id: "Pain Relief", label: "Pain Relief", Icon: Pill, iconBg: "bg-orange-100", iconColor: "text-orange-500" },
    { id: "Vitamins & Suppl.", label: "Vitamins & Suppl.", Icon: Sparkles, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
    { id: "Skin Care", label: "Skin Care", Icon: Droplets, iconBg: "bg-rose-100", iconColor: "text-rose-500" },
    { id: "Diabetes Care", label: "Diabetes Care", Icon: Activity, iconBg: "bg-teal-100", iconColor: "text-teal-700" },
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
  { id: "doctor", label: "Doctor", sub: "Add Doctor", Icon: Stethoscope, color: "text-[#00796b]", bg: "bg-teal-50" },
  { id: "refill", label: "Refill", sub: "Quick Refill", Icon: RefreshCcw, color: "text-amber-600", bg: "bg-amber-50" },
  { id: "loyalty", label: "Loyalty", sub: "Points", Icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
  { id: "note", label: "Note", sub: "Sales Note", Icon: FileText, color: "text-teal-600", bg: "bg-teal-50" },
  { id: "return", label: "Return", sub: "Quick Return", Icon: RotateCcw, color: "text-orange-500", bg: "bg-orange-50" },
  { id: "sales-history", label: "History", sub: "Sales Log", Icon: History, color: "text-indigo-600", bg: "bg-indigo-50" },
  { id: "open-drawer", label: "Drawer", sub: "Cash Drawer", Icon: Archive, color: "text-emerald-600", bg: "bg-emerald-50" },
];

function MedCrossLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-lg bg-[#00897b] text-white shadow-xs"
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
          "h-20 w-full rounded-sm object-cover border transition",
          darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100"
        )}
      />
    );
  }
  return (
    <div className={cn(
      "flex h-20 w-full items-center justify-center rounded-sm border transition",
      darkMode ? "bg-slate-800/80 border-slate-700/80" : "bg-slate-100 border-slate-100"
    )}>
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-md transition",
        darkMode ? "bg-slate-700/80 text-teal-400" : "bg-slate-200/80 text-teal-700"
      )}>
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
      {/* ═══ LEFT PANEL HEADER ═══ */}
      <header className={cn("flex flex-none items-center gap-2.5 border-b px-4 py-2.5 transition", darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")}>
        <Link href="/pharmacy" className="flex shrink-0 items-center gap-2.5">
          <MedCrossLogo size={40} />
          <div className="leading-tight">
            <h1 className="text-[17px] font-bold text-[#00897b] tracking-tight">BPOS</h1>
            <p className={cn("text-[10px] font-semibold", darkMode ? "text-slate-400" : "text-slate-500")}>Pharmacy</p>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="mx-1 flex-1 min-w-[220px]">
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
            darkMode={darkMode}
            themeColor="teal"
            className="text-[12px] h-9 shadow-2xs font-normal"
          />
        </div>

        {/* Top Action Pills */}
        <div className="hidden lg:flex items-center gap-1.5 shrink-0">
          {[
            { id: "scan-rx", label: "Scan Rx", Icon: Camera },
            { id: "scan-barcode", label: "Scan Barcode", Icon: ScanLine },
            { id: "quick-refill", label: "Quick Refill", Icon: RefreshCcw },
            { id: "add-medicine", label: "Add Medicine", Icon: Plus },
          ].map(({ id, label, Icon }) => (
            <CustomButton
              key={id}
              size="sm"
              variant={darkMode ? "secondary" : "outline"}
              themeColor="teal"
              className="rounded-sm gap-1.5 text-[11.5px] font-semibold h-8"
              onClick={() => onQuickAction?.(id)}
            >
              <Icon size={13} />
              {label}
            </CustomButton>
          ))}
        </div>

        {/* Vertical Divider */}
        <div className={cn("h-6 w-px mx-1 shrink-0 hidden sm:block", darkMode ? "bg-slate-800" : "bg-slate-200")} />

        {/* Moon icon */}
        <CustomButton
          variant="ghost"
          size="xs"
          onClick={onToggleDarkMode}
          className={cn(
            "rounded-sm h-8 w-8 !p-0 flex items-center justify-center shrink-0",
            darkMode ? "bg-slate-800 text-yellow-300 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-100",
          )}
          title="Toggle dark mode"
        >
          <Moon size={16} />
        </CustomButton>

        {/* Fullscreen toggle */}
        <CustomButton
          variant="ghost"
          size="xs"
          onClick={onToggleFullscreen}
          className={cn(
            "rounded-sm h-8 w-8 !p-0 flex items-center justify-center shrink-0",
            darkMode ? "bg-slate-800 text-teal-300 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-100",
          )}
          title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </CustomButton>
      </header>

      {/* ═══ MAIN LEFT BODY (Sidebar + Grid) ═══ */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* CATEGORY SIDEBAR */}
        <aside className={cn(
          "flex w-[190px] shrink-0 flex-col border-r xl:w-[210px] transition",
          darkMode ? "border-slate-800 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-800"
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
                <CustomButton
                  key={id}
                  variant={active ? "primary" : "ghost"}
                  themeColor={active ? "teal" : undefined}
                  onClick={() => setCategory(id)}
                  className={cn(
                    "w-full !justify-start items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-[12px] font-bold transition h-auto",
                    !active && (darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100")
                  )}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-sm transition",
                      active
                        ? "bg-white/20 text-white"
                        : darkMode
                          ? "bg-slate-800 text-teal-400"
                          : `${iconBg} ${iconColor}`,
                    )}
                  >
                    <Icon size={13} strokeWidth={2.2} />
                  </div>
                  <span className="truncate">{label}</span>
                </CustomButton>
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
                  : "border-teal-200/70 bg-[#e8f4f8] hover:border-teal-300"
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[#00796b] text-white shadow-xs">
                <User size={16} />
              </div>
              <div className="leading-tight min-w-0 text-left">
                <p className={cn("text-[12.5px] font-bold", darkMode ? "text-slate-100" : "text-slate-800")}>Customer</p>
                <p className="text-[10px] font-medium text-slate-400 truncate">Add / View Customer</p>
              </div>
            </CustomButton>
          </div>
        </aside>

        {/* PRODUCTS GRID AREA */}
        <main className={cn(
          "flex min-w-0 flex-1 flex-col overflow-hidden transition",
          darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50/50 text-slate-800"
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
                      !active && (darkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border-0" : "bg-[#f2f4f7] text-slate-700 hover:bg-slate-200/80 border-0")
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
                        "group relative flex flex-col justify-between rounded-sm border p-2.5 text-left shadow-xs transition hover:border-teal-400 hover:shadow-md cursor-pointer",
                        darkMode ? "border-slate-800 bg-slate-900 text-slate-100" : "border-slate-200/90 bg-white text-slate-800",
                        outOfStock && (darkMode ? "opacity-40 pointer-events-none bg-slate-900/50" : "opacity-40 pointer-events-none bg-slate-50/50"),
                      )}
                    >
                      <div>
                        {/* Product Thumbnail */}
                        <div className="relative mb-2 overflow-hidden rounded-sm">
                          <ProductThumb product={p} darkMode={darkMode} />
                          {outOfStock ? (
                            <CustomBadge tone="red" className="absolute top-2 left-2 z-10">
                              Out of stock
                            </CustomBadge>
                          ) : rxMode && isRx ? (
                            <CustomBadge tone="primary" className="absolute top-2 left-2 z-10 bg-[#00796b] text-white border-transparent">
                              Rx
                            </CustomBadge>
                          ) : null}
                        </div>

                        {/* Product Title */}
                        <h3 className={cn(
                          "line-clamp-1 text-[12.5px] font-extrabold transition",
                          darkMode ? "text-slate-100 group-hover:text-teal-400" : "text-slate-800 group-hover:text-[#00796b]"
                        )}>
                          {p.name}
                        </h3>

                        {/* Generic Name */}
                        {p.genericName ? (
                          <p className="line-clamp-1 text-[10px] font-medium text-[#00796b] dark:text-teal-400">
                            Gen: {p.genericName}
                          </p>
                        ) : null}

                        {/* Unit & Dosage */}
                        <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                          {p.unit || "Tablet • 10mg"}
                        </p>

                        {/* Stock Info */}
                        <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                          Stock: <span className={darkMode ? "text-slate-300" : "text-slate-600"}>{p.stockQty ?? 0}</span>
                        </p>
                      </div>

                      {/* Price & Add Button */}
                      <div className={cn(
                        "mt-2.5 flex items-center justify-between pt-1 border-t",
                        darkMode ? "border-slate-800" : "border-slate-100"
                      )}>
                        <span className="text-[13.5px] font-black text-[#00796b] tabular-nums whitespace-nowrap">
                          ৳ {p.sellingPrice.toFixed(2)}
                        </span>
                        <CustomButton
                          themeColor="teal"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!outOfStock) onTapProduct(p);
                          }}
                          className="h-7 w-7 !p-0 rounded-sm flex items-center justify-center shrink-0 shadow-xs hover:scale-105 active:scale-95 text-white"
                          title="Add to cart"
                        >
                          <Plus size={15} strokeWidth={2.8} />
                        </CustomButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 animate-in fade-in zoom-in-95 duration-300">
                <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-4 border shadow-inner", darkMode ? "bg-slate-900 border-slate-800 text-slate-700" : "bg-slate-50 border-slate-100 text-slate-200")}>
                  <Pill size={40} />
                </div>
                <p className={cn("text-base font-bold", darkMode ? "text-slate-300" : "text-slate-600")}>No medicines found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px] text-center font-medium leading-relaxed uppercase tracking-wider">Try adjusting your search or category filter</p>
              </div>
            )}
          </div>

          {/* GENERIC ALTERNATIVES BANNER (Always present above bottom actions) */}
          <div className={cn("flex-none px-3 pb-2 pt-1 transition", darkMode ? "bg-slate-950" : "bg-slate-50/50")}>
            <div className={cn(
              "flex items-center justify-between gap-3 rounded-sm border px-3.5 py-2 shadow-2xs transition",
              darkMode ? "bg-slate-900 border-teal-900/80 text-slate-100" : "bg-[#f0faf8] border-[#cceee7] text-slate-800"
            )}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-sm shadow-2xs", darkMode ? "bg-slate-800 text-teal-400" : "bg-white text-[#10b981]")}>
                  <Leaf size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className={cn("text-[12.5px] font-bold truncate leading-snug", darkMode ? "text-slate-100" : "text-slate-800")}>
                    Generic Alternative Available
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400 truncate leading-snug">
                    {lastAddedProduct && genericAlternatives.length > 0 ? (
                      <>
                        <span className="font-semibold text-[#00796b] dark:text-teal-400">{lastAddedProduct.name}</span>
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
                className="inline-flex items-center gap-1.5 rounded-sm bg-[#00796b] hover:bg-[#00695c] px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition shadow-2xs shrink-0 cursor-pointer"
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
                      ? "border-slate-800 bg-slate-800/90 text-slate-100 hover:border-teal-500 hover:bg-slate-700/80"
                      : "border-slate-200 bg-white text-slate-800 hover:border-teal-400 hover:bg-teal-50/20"
                  )}
                >
                  <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-sm transition", darkMode ? "bg-slate-700" : bg)}>
                    <Icon size={14} className={darkMode ? "text-teal-400" : color} />
                  </div>
                  <div className="flex flex-col items-center justify-center w-full min-w-0 leading-none">
                    <span className={cn(
                      "text-[11px] font-bold leading-tight truncate w-full block text-center px-0.5",
                      darkMode ? "text-slate-100 group-hover:text-teal-400" : "text-slate-800 group-hover:text-[#00796b]"
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
