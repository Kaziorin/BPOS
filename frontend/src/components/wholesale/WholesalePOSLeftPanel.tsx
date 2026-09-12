"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  ScanLine,
  FileText,
  Warehouse,
  CreditCard,
  Truck,
  Percent,
  LayoutGrid,
  Smartphone,
  Laptop,
  Headphones,
  Home,
  Shirt,
  Dumbbell,
  Filter,
  List,
  Grid2X2,
  Plus,
  Package,
} from "lucide-react";
import type { RegisterProduct } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import {
  CustomBadge,
  CustomButton,
  CustomCheckbox,
  CustomInput,
  CustomSelect,
  CustomTabs,
} from "@/components/custom";
import type { WsCategory, WsSortBy } from "./wholesale-pos-types";

export const WS_CATEGORIES: {
  id: WsCategory;
  label: string;
  Icon: React.ElementType;
}[] = [
  { id: "All Products", label: "All Products", Icon: LayoutGrid },
  { id: "Electronics", label: "Electronics", Icon: Headphones },
  { id: "Mobiles", label: "Mobiles", Icon: Smartphone },
  { id: "Computers", label: "Computers", Icon: Laptop },
  { id: "Accessories", label: "Accessories", Icon: Package },
  { id: "Home Appliances", label: "Home Appliances", Icon: Home },
  { id: "Fashion", label: "Fashion", Icon: Shirt },
  { id: "Sports", label: "Sports", Icon: Dumbbell },
];

const QUICK_ACTIONS = [
  { id: "sales", label: "Sales Order", Icon: FileText },
  { id: "warehouse", label: "Warehouse", Icon: Warehouse },
  { id: "credit", label: "Credit", Icon: CreditCard },
  { id: "delivery", label: "Delivery", Icon: Truck },
  { id: "commission", label: "Commission", Icon: Percent },
];

function fmt(n: number) {
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function stockStatus(qty?: number) {
  const q = qty ?? 0;
  if (q <= 0) return { label: "Out of Stock", tone: "red" as const, dot: "bg-rose-500" };
  if (q <= 10) return { label: "Low Stock", tone: "amber" as const, dot: "bg-amber-500" };
  return { label: "In Stock", tone: "green" as const, dot: "bg-emerald-500" };
}

interface WholesalePOSLeftPanelProps {
  search: string;
  setSearch: (v: string) => void;
  searchRef?: React.RefObject<HTMLInputElement | null>;
  category: WsCategory;
  setCategory: (c: WsCategory) => void;
  sortBy: WsSortBy;
  setSortBy: (s: WsSortBy) => void;
  lowStockOnly: boolean;
  setLowStockOnly: (v: boolean) => void;
  products: RegisterProduct[];
  onTapProduct: (p: RegisterProduct) => void;
  warehouseName?: string;
  onQuickAction?: (id: string) => void;
  onScan?: () => void;
  onOpenFilters?: () => void;
  darkMode?: boolean;
}

export function WholesalePOSLeftPanel({
  search,
  setSearch,
  searchRef,
  category,
  setCategory,
  sortBy,
  setSortBy,
  lowStockOnly,
  setLowStockOnly,
  products,
  onTapProduct,
  warehouseName = "All Warehouses",
  onQuickAction,
  onScan,
  onOpenFilters,
  darkMode = false,
}: WholesalePOSLeftPanelProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const filtered = useMemo(() => {
    let list = [...products];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode || "").toLowerCase().includes(q),
      );
    }
    if (category !== "All Products") {
      list = list.filter((p) => {
        const cat = (p.categoryName || "").toLowerCase();
        const name = p.name.toLowerCase();
        const key = category.toLowerCase();
        return cat.includes(key.split(" ")[0]) || name.includes(key.split(" ")[0]);
      });
    }
    if (lowStockOnly) {
      list = list.filter((p) => (p.stockQty ?? 0) > 0 && (p.stockQty ?? 0) <= 10);
    }
    switch (sortBy) {
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price-asc":
        list.sort((a, b) => a.sellingPrice - b.sellingPrice);
        break;
      case "price-desc":
        list.sort((a, b) => b.sellingPrice - a.sellingPrice);
        break;
      case "stock":
        list.sort((a, b) => (b.stockQty ?? 0) - (a.stockQty ?? 0));
        break;
      default:
        list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [products, search, category, lowStockOnly, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice(page * pageSize, page * pageSize + pageSize);

  useEffect(() => {
    setPage(0);
  }, [search, category, lowStockOnly, sortBy]);

  const categoryTabs = WS_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    icon: <c.Icon size={14} strokeWidth={2.2} />,
  }));

  const darkField =
    "!bg-slate-800 !border-slate-700 !text-slate-100 placeholder:!text-slate-500";

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Search + quick actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <CustomInput
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU..."
            leftIcon={<Search size={15} />}
            rightIcon={
              <button
                type="button"
                onClick={onScan}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-lg text-primary-600",
                  darkMode ? "hover:bg-primary-500/15" : "hover:bg-primary-50",
                )}
              >
                <ScanLine size={14} />
              </button>
            }
            className={cn(
              "!h-9 !rounded-xl !py-1.5",
              darkMode
                ? cn(darkField, "shadow-sm")
                : "!border-primary-100 shadow-xs",
            )}
            containerClassName="flex-1"
          />
        </div>

        <div className="flex items-center gap-1">
          {QUICK_ACTIONS.map((a) => (
            <CustomButton
              key={a.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onQuickAction?.(a.id)}
              className={cn(
                "!h-9 !gap-1.5 !rounded-xl !px-2.5",
                darkMode
                  ? "!border-slate-700 !bg-slate-800 shadow-sm hover:!bg-slate-700"
                  : "!border-primary-50 shadow-xs hover:!bg-primary-50/40",
              )}
            >
              <a.Icon size={14} className="text-primary-500" />
              <span className={cn("text-[10px] font-bold", darkMode ? "text-slate-400" : "text-gray-600")}>
                {a.label}
              </span>
            </CustomButton>
          ))}
        </div>
      </div>

      {/* Categories via CustomTabs */}
      <CustomTabs
        tabs={categoryTabs}
        activeTab={category}
        onChange={(id) => setCategory(id as WsCategory)}
        themeColor="blue"
        darkMode={darkMode}
        className={cn(
          "!rounded-xl !p-1 shadow-sm transition-all",
          darkMode
            ? "!border-slate-700/50 !bg-slate-900/60"
            : "!border-white !bg-white",
        )}
      />

      {/* Filters row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CustomButton
            type="button"
            variant="outline"
            size="xs"
            onClick={onOpenFilters}
            leftIcon={<Filter size={13} />}
            className={cn(
              "!h-9 !rounded-xl !px-3 !text-[11px] font-bold shadow-sm transition-all",
              darkMode ? "!border-slate-700 !bg-slate-800 !text-slate-200" : "!border-slate-200 !bg-white !text-slate-600 hover:!border-blue-300 hover:!text-blue-600",
            )}
          >
            Filters
          </CustomButton>

          <CustomSelect
            value="all"
            onChange={() => {}}
            options={[{ value: "all", label: warehouseName }]}
            className={cn(
              "!h-9 !rounded-xl !py-1.5 !text-[11px] !font-bold shadow-sm transition-all",
              darkMode ? darkField : "!border-slate-200 !bg-white hover:!border-blue-300",
            )}
            containerClassName="w-[150px]"
          />

          <div
            className={cn(
              "inline-flex h-9 items-center rounded-xl border px-3 transition-colors shadow-sm",
              darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white",
            )}
          >
            <CustomCheckbox
              label={<span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Low Stock Only</span>}
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              themeColor="blue"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CustomSelect
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as WsSortBy)}
            options={[
              { value: "name-asc", label: "Sort by: Name A-Z" },
              { value: "name-desc", label: "Sort by: Name Z-A" },
              { value: "price-asc", label: "Sort by: Price ↑" },
              { value: "price-desc", label: "Sort by: Price ↓" },
              { value: "stock", label: "Sort by: Stock" },
            ]}
            className={cn(
              "!h-9 !rounded-xl !py-1.5 !text-[11px] !font-bold shadow-sm transition-all",
              darkMode ? darkField : "!border-slate-200 !bg-white hover:!border-blue-300",
            )}
            containerClassName="w-[140px]"
          />

          <div
            className={cn(
              "flex rounded-xl border p-0.5 shadow-sm transition-all",
              darkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white",
            )}
          >
            <CustomButton
              type="button"
              variant={viewMode === "grid" ? "primary" : "ghost"}
              themeColor="blue"
              size="xs"
              onClick={() => setViewMode("grid")}
              className={cn(
                "!h-7 !w-7 !rounded-md !px-0",
                darkMode && viewMode !== "grid" && "!text-slate-400 hover:!bg-slate-700",
                !darkMode && viewMode !== "grid" && "!text-slate-400 hover:!bg-blue-50 hover:!text-blue-600",
              )}
            >
              <Grid2X2 size={13} />
            </CustomButton>
            <CustomButton
              type="button"
              variant={viewMode === "list" ? "primary" : "ghost"}
              themeColor="blue"
              size="xs"
              onClick={() => setViewMode("list")}
              className={cn(
                "!h-7 !w-7 !rounded-md !px-0",
                darkMode && viewMode !== "list" && "!text-slate-400 hover:!bg-slate-700",
                !darkMode && viewMode !== "list" && "!text-slate-400 hover:!bg-blue-50 hover:!text-blue-600",
              )}
            >
              <List size={13} />
            </CustomButton>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1 -mr-1 no-scrollbar">
        <AnimatePresence mode="popLayout">
          {pageItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "flex h-full min-h-[220px] flex-col items-center justify-center gap-2",
                darkMode ? "text-slate-500" : "text-slate-400",
              )}
            >
              <Package size={36} className="opacity-40" />
              <p className="text-sm font-bold uppercase tracking-widest">No products found</p>
            </motion.div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-3 gap-2 pb-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
              {pageItems.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  onAdd={() => onTapProduct(p)}
                  darkMode={darkMode}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2 pb-2">
              {pageItems.map((p, i) => (
                <ProductListRow
                  key={p.id}
                  product={p}
                  index={i}
                  onAdd={() => onTapProduct(p)}
                  darkMode={darkMode}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-1">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === page
                  ? "w-8 bg-blue-600"
                  : darkMode
                    ? "w-2 bg-slate-700 hover:bg-slate-600"
                    : "w-2 bg-blue-100 hover:bg-blue-200",
              )}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  index,
  onAdd,
  darkMode = false,
}: {
  product: RegisterProduct;
  index: number;
  onAdd: () => void;
  darkMode?: boolean;
}) {
  const status = stockStatus(product.stockQty);
  const disabled = (product.stockQty ?? 0) <= 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.015, duration: 0.35 }}
      whileHover={disabled ? undefined : { y: -3 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border transition-all text-left",
        darkMode
          ? "border-slate-700 bg-slate-800 shadow-lg"
          : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-[0_6px_24px_rgba(37,99,235,0.06)]",
        disabled && "opacity-60",
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-contain p-1.5 transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package size={20} className={darkMode ? "text-slate-700" : "text-slate-200"} />
          </div>
        )}

        <div className="absolute top-1.5 left-1.5">
          <span className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter shadow-sm",
            (product.stockQty ?? 0) <= 10
              ? "bg-amber-100 text-amber-600"
              : "bg-emerald-100 text-emerald-600"
          )}>
            <div className={cn("w-1 h-1 rounded-full animate-pulse", (product.stockQty ?? 0) <= 10 ? "bg-amber-500" : "bg-emerald-500")} />
            {(product.stockQty ?? 0) <= 10 ? "Low" : "In Stock"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-2">
        <h3 className={cn("line-clamp-2 min-h-[2.6em] text-[11px] font-bold leading-tight", darkMode ? "text-slate-100" : "text-slate-900")}>
          {product.name}
        </h3>
        <p className={cn("mt-0.5 text-[9px] font-medium", darkMode ? "text-slate-500" : "text-slate-400")}>
          {product.sku}
        </p>

        <div className="mt-auto flex items-end justify-between pt-1.5">
          <p className="text-[13px] font-black text-blue-600 tabular-nums leading-none">
            {fmt(product.sellingPrice)}
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-lg transition-all active:scale-90 shadow-sm",
              darkMode
                ? "bg-blue-600 text-white shadow-blue-600/20"
                : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
            )}
          >
            <Plus size={12} strokeWidth={3} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ProductListRow({
  product,
  index,
  onAdd,
  darkMode = false,
}: {
  product: RegisterProduct;
  index: number;
  onAdd: () => void;
  darkMode?: boolean;
}) {
  const status = stockStatus(product.stockQty);
  const disabled = (product.stockQty ?? 0) <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-3 py-2.5 shadow-sm transition-all",
        darkMode
          ? "border-slate-700 bg-slate-800 hover:border-primary-500/40 hover:shadow-md hover:shadow-primary-600/10"
          : "border-gray-100 bg-white hover:border-primary-100 hover:shadow-md",
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl",
          darkMode ? "bg-slate-900" : "bg-gray-50",
        )}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <Package size={22} className={darkMode ? "text-slate-500" : "text-gray-300"} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3
            className={cn(
              "truncate text-[13px] font-bold",
              darkMode ? "text-slate-100" : "text-gray-900",
            )}
          >
            {product.name}
          </h3>
          <CustomBadge tone={status.tone} className="!py-0.5 !text-[9px] !font-bold">
            <span className={cn("mr-1 inline-block h-1 w-1 rounded-full", status.dot)} />
            {status.label}
          </CustomBadge>
        </div>
        <p className={cn("text-[11px] font-medium", darkMode ? "text-slate-500" : "text-gray-400")}>
          {product.sku}
        </p>
      </div>
      <p
        className={cn(
          "text-[15px] font-bold tabular-nums",
          darkMode ? "text-slate-100" : "text-gray-900",
        )}
      >
        {fmt(product.sellingPrice)}
      </p>
      <CustomButton
        type="button"
        disabled={disabled}
        onClick={onAdd}
        className="!h-9 !w-9 !rounded-full !px-0"
      >
        <Plus size={16} />
      </CustomButton>
    </motion.div>
  );
}
