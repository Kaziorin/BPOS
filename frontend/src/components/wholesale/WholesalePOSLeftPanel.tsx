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
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Search + quick actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <CustomInput
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, SKU or barcode..."
            leftIcon={<Search size={16} />}
            rightIcon={
              <button
                type="button"
                onClick={onScan}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg text-primary-600",
                  darkMode ? "hover:bg-primary-500/15" : "hover:bg-primary-50",
                )}
                title="Scan barcode"
              >
                <ScanLine size={16} />
              </button>
            }
            className={cn(
              "!h-11 !rounded-2xl !py-2.5",
              darkMode
                ? cn(darkField, "shadow-[0_4px_18px_rgba(0,0,0,0.25)]")
                : "!border-primary-100 shadow-[0_4px_18px_rgba(0,102,255,0.05)]",
            )}
            containerClassName="flex-1"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {QUICK_ACTIONS.map((a) => (
            <CustomButton
              key={a.id}
              type="button"
              variant="outline"
              onClick={() => onQuickAction?.(a.id)}
              className={cn(
                "!h-[64px] !w-[68px] !flex-col !gap-1 !rounded-2xl !px-1 !py-1.5",
                darkMode
                  ? "!border-slate-700 !bg-slate-800 shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:!border-primary-500/40 hover:!bg-slate-700"
                  : "!border-primary-50 shadow-[0_4px_14px_rgba(0,102,255,0.06)] hover:!border-primary-200 hover:!bg-primary-50/40",
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-600/25">
                <a.Icon size={15} strokeWidth={2.2} />
              </span>
              <span
                className={cn(
                  "text-[9px] font-bold leading-tight",
                  darkMode ? "text-slate-400" : "text-gray-600",
                )}
              >
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
        themeColor="primary"
        className={cn(
          "!rounded-2xl !p-1.5 shadow-sm",
          darkMode
            ? "!border-slate-700 !bg-slate-900/90"
            : "!border-primary-50 !bg-white/90",
        )}
      />

      {/* Filters row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CustomButton
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenFilters}
            leftIcon={<Filter size={13} />}
            className={cn(
              "!rounded-xl",
              darkMode && "!border-slate-700 !bg-slate-800 !text-slate-100 hover:!bg-slate-700",
            )}
          >
            Filters
          </CustomButton>

          <CustomSelect
            value="all"
            options={[{ value: "all", label: warehouseName }]}
            className={cn(
              "!h-9 !rounded-xl !py-1.5 !text-xs !font-semibold",
              darkMode && darkField,
            )}
            containerClassName="w-[160px]"
          />

          <div
            className={cn(
              "inline-flex h-9 items-center rounded-xl border px-3",
              darkMode ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white",
            )}
          >
            <CustomCheckbox
              label="Low Stock Only"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              themeColor="primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CustomSelect
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as WsSortBy)}
            options={[
              { value: "name-asc", label: "Sort by: Name A–Z" },
              { value: "name-desc", label: "Sort by: Name Z–A" },
              { value: "price-asc", label: "Sort by: Price ↑" },
              { value: "price-desc", label: "Sort by: Price ↓" },
              { value: "stock", label: "Sort by: Stock" },
            ]}
            className={cn(
              "!h-9 !rounded-xl !py-1.5 !text-xs !font-semibold",
              darkMode && darkField,
            )}
            containerClassName="w-[170px]"
          />

          <div
            className={cn(
              "flex rounded-xl border p-0.5",
              darkMode ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white",
            )}
          >
            <CustomButton
              type="button"
              variant={viewMode === "grid" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn(
                "!h-8 !w-8 !rounded-lg !px-0",
                darkMode && viewMode !== "grid" && "!text-slate-400 hover:!bg-slate-700 hover:!text-slate-100",
              )}
              aria-label="Grid view"
            >
              <Grid2X2 size={14} />
            </CustomButton>
            <CustomButton
              type="button"
              variant={viewMode === "list" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn(
                "!h-8 !w-8 !rounded-lg !px-0",
                darkMode && viewMode !== "list" && "!text-slate-400 hover:!bg-slate-700 hover:!text-slate-100",
              )}
              aria-label="List view"
            >
              <List size={14} />
            </CustomButton>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1 -mr-1">
        <AnimatePresence mode="popLayout">
          {pageItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "flex h-full min-h-[220px] flex-col items-center justify-center gap-2",
                darkMode ? "text-slate-500" : "text-gray-400",
              )}
            >
              <Package size={36} className="opacity-40" />
              <p className="text-sm font-semibold">No products found</p>
            </motion.div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3 pb-2 xl:grid-cols-3 2xl:grid-cols-4">
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
                "h-2 rounded-full transition-all",
                i === page
                  ? "w-6 bg-primary-600"
                  : darkMode
                    ? "w-2 bg-slate-700 hover:bg-slate-600"
                    : "w-2 bg-primary-200 hover:bg-primary-300",
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
      initial={{ opacity: 0, y: 16, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        disabled
          ? undefined
          : {
              y: -6,
              rotateX: 2,
              rotateY: -2,
              boxShadow: darkMode
                ? "0 20px 40px rgba(0,102,255,0.22)"
                : "0 20px 40px rgba(0,102,255,0.14)",
            }
      }
      style={{ transformStyle: "preserve-3d", perspective: 800 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border p-3",
        darkMode
          ? "border-slate-700 bg-slate-800 shadow-[0_4px_18px_rgba(0,0,0,0.3)]"
          : "border-gray-100 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]",
        disabled && "opacity-60",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          darkMode ? "from-primary-500/10" : "from-primary-50/40",
        )}
      />

      <CustomBadge
        tone={status.tone}
        className="absolute top-3 left-3 z-10 !gap-1.5 !py-0.5 !text-[10px] !font-bold"
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
        {status.label}
      </CustomBadge>

      <div
        className="relative mt-5 mb-3 flex h-[110px] items-center justify-center"
        style={{ transform: "translateZ(20px)" }}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="max-h-full max-w-full object-contain drop-shadow-[0_12px_20px_rgba(15,23,42,0.15)] transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              "flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner",
              darkMode
                ? "from-slate-700 to-slate-800 text-slate-500"
                : "from-gray-100 to-gray-50 text-gray-300",
            )}
          >
            <Package size={32} />
          </div>
        )}
      </div>

      <div className="relative mt-auto space-y-1 pr-10">
        <h3
          className={cn(
            "line-clamp-2 min-h-[2.4em] text-[13px] font-bold leading-snug",
            darkMode ? "text-slate-100" : "text-gray-900",
          )}
        >
          {product.name}
        </h3>
        <p className={cn("text-[11px] font-medium", darkMode ? "text-slate-500" : "text-gray-400")}>
          {product.sku}
        </p>
        <p
          className={cn(
            "pt-0.5 text-[16px] font-bold tabular-nums",
            darkMode ? "text-slate-100" : "text-gray-900",
          )}
        >
          {fmt(product.sellingPrice)}
        </p>
      </div>

      <CustomButton
        type="button"
        disabled={disabled}
        onClick={onAdd}
        className="absolute bottom-3 right-3 z-10 !h-9 !w-9 !rounded-full !px-0 shadow-lg shadow-primary-600/35"
        aria-label={`Add ${product.name}`}
      >
        <Plus size={18} strokeWidth={2.5} />
      </CustomButton>
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
