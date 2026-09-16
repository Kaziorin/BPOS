"use client";

import React, { useEffect, useMemo, useState } from "react";
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

  const iceBlue = "#146EF5";
  const darkText = "#10213D";
  const mutedText = "#64748B";
  const iceBorder = "#DCE8F2";
  const iceCard = "#FFFFFF";
  const iceInputBg = "#F5FAFE";

  const darkField =
    "!bg-slate-800 !border-slate-700 !text-slate-100 placeholder:!text-slate-500";

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      {/* Search + quick actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <CustomInput
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, barcode..."
            leftIcon={<Search size={15} className={darkMode ? "text-slate-400" : ""} style={darkMode ? undefined : { color: mutedText }} />}
            rightIcon={
              <button
                type="button"
                onClick={onScan}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-lg transition-colors cursor-pointer",
                  darkMode ? "hover:bg-primary-500/15 text-primary-400" : "",
                )}
                style={darkMode ? undefined : { color: iceBlue }}
              >
                <ScanLine size={14} />
              </button>
            }
            className={cn(
              "!h-9 !rounded-xl !py-1.5",
              darkMode ? cn(darkField, "shadow-sm") : "",
            )}
            style={darkMode ? undefined : {
              background: iceInputBg,
              border: `1px solid ${iceBorder}`,
              color: darkText,
            }}
            containerClassName="flex-1"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onQuickAction?.(a.id)}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-xl px-3 text-[11px] font-bold transition-all cursor-pointer hover:shadow-sm",
                darkMode
                  ? "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "",
              )}
              style={darkMode ? undefined : {
                background: iceCard,
                border: `1px solid ${iceBorder}`,
                color: darkText,
              }}
              onMouseEnter={e => { if (!darkMode) { (e.currentTarget as HTMLButtonElement).style.background = "#EBF3FE"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#BEDCFD"; (e.currentTarget as HTMLButtonElement).style.color = iceBlue; } }}
              onMouseLeave={e => { if (!darkMode) { (e.currentTarget as HTMLButtonElement).style.background = iceCard; (e.currentTarget as HTMLButtonElement).style.borderColor = iceBorder; (e.currentTarget as HTMLButtonElement).style.color = darkText; } }}
            >
              <a.Icon size={14} style={{ color: iceBlue }} className={darkMode ? "text-blue-400" : ""} />
              <span className="whitespace-nowrap">{a.label}</span>
            </button>
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
          "!rounded-xl !p-1 shadow-sm transition-all border",
          darkMode ? "!border-slate-700/50 !bg-slate-900/60" : "",
        )}
        style={darkMode ? undefined : { background: iceInputBg, border: `1px solid ${iceBorder}` } as React.CSSProperties}
      />

      {/* Filters row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenFilters}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-xl px-3 text-[11px] font-bold transition-all cursor-pointer",
              darkMode ? "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" : "",
            )}
            style={darkMode ? undefined : { background: iceCard, border: `1px solid ${iceBorder}`, color: darkText }}
          >
            <Filter size={13} style={darkMode ? undefined : { color: iceBlue }} />
            Filters
          </button>

          <CustomSelect
            value="all"
            onChange={() => {}}
            options={[{ value: "all", label: warehouseName }]}
            className={cn(
              "!h-9 !rounded-xl !py-1.5 !text-[11px] !font-bold shadow-sm transition-all",
              darkMode ? darkField : "",
            )}
            style={darkMode ? undefined : {
              background: iceCard,
              border: `1px solid ${iceBorder}`,
              color: darkText,
            } as React.CSSProperties}
            containerClassName="w-[150px]"
          />

          <div
            className={cn(
              "inline-flex h-9 items-center rounded-xl border px-3 transition-colors shadow-sm",
              darkMode ? "border-slate-700 bg-slate-800" : "",
            )}
            style={darkMode ? undefined : { background: iceCard, border: `1px solid ${iceBorder}` }}
          >
            <CustomCheckbox
              label={
                <span
                  className="text-[11px] font-bold whitespace-nowrap"
                  style={{ color: darkText }}
                >
                  Low Stock Only
                </span>
              }
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
              darkMode ? darkField : "",
            )}
            style={darkMode ? undefined : {
              background: iceCard,
              border: `1px solid ${iceBorder}`,
              color: darkText,
            } as React.CSSProperties}
            containerClassName="w-[155px]"
          />

          <div
            className={cn(
              "flex rounded-xl border p-0.5 shadow-sm transition-all",
              darkMode ? "border-slate-700 bg-slate-800" : "",
            )}
            style={darkMode ? undefined : { background: iceCard, border: `1px solid ${iceBorder}` }}
          >
            <CustomButton
              type="button"
              variant={viewMode === "grid" ? "primary" : "ghost"}
              themeColor="blue"
              size="xs"
              onClick={() => setViewMode("grid")}
              className={cn(
                "!h-7 !w-7 !rounded-md !px-0 cursor-pointer",
                darkMode && viewMode !== "grid" && "!text-slate-400 hover:!bg-slate-700",
                !darkMode && viewMode !== "grid" && "!text-slate-500 hover:!bg-blue-50 hover:!text-blue-600",
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
                "!h-7 !w-7 !rounded-md !px-0 cursor-pointer",
                darkMode && viewMode !== "list" && "!text-slate-400 hover:!bg-slate-700",
                !darkMode && viewMode !== "list" && "!text-slate-500 hover:!bg-blue-50 hover:!text-blue-600",
              )}
            >
              <List size={13} />
            </CustomButton>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1 -mr-1 no-scrollbar">
        {pageItems.length === 0 ? (
          <div
            className={cn(
              "flex h-full min-h-[220px] flex-col items-center justify-center gap-2.5 rounded-sm border-dashed py-12 text-center transition-colors border",
              darkMode ? "border-slate-800 bg-slate-900/30" : "",
            )}
            style={darkMode ? undefined : { background: "#F5FAFE", borderColor: iceBorder }}
          >
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-sm border shadow-sm",
                darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "",
              )}
              style={darkMode ? undefined : { background: "#EBF3FE", color: iceBlue, border: `1px solid #BEDCFD` }}
            >
              <Package size={28} />
            </div>
            <div>
              <p
                className={cn("text-sm font-extrabold tracking-wide uppercase", darkMode ? "text-slate-300" : "")}
                style={darkMode ? undefined : { color: darkText }}
              >
                No products found
              </p>
              <p
                className={cn("text-xs font-medium mt-0.5", darkMode ? "text-slate-500" : "")}
                style={darkMode ? undefined : { color: mutedText }}
              >
                Try adjusting your search query or filters
              </p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-3 gap-2.5 pb-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
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
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-1">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300 cursor-pointer",
                i === page
                  ? "w-8 bg-blue-600"
                  : darkMode
                    ? "w-2 bg-slate-700 hover:bg-slate-600"
                    : "w-2 bg-blue-200 hover:bg-blue-300",
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
  const disabled = (product.stockQty ?? 0) <= 0;
  const lowStock = (product.stockQty ?? 0) <= 10;
  const iceBlue = "#146EF5";
  const darkText = "#10213D";
  const mutedText = "#64748B";
  const iceBorder = "#DCE8F2";

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl transition-all text-left cursor-pointer",
        darkMode
          ? "border border-slate-700 bg-slate-800 shadow-lg hover:border-blue-500/50"
          : "hover:shadow-[0_4px_20px_rgba(20,110,245,0.12)]",
        disabled && "opacity-60",
      )}
      style={darkMode ? undefined : { background: "#FFFFFF", border: `1px solid ${iceBorder}` }}
      onClick={() => !disabled && onAdd()}
    >
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden border-b",
          darkMode ? "bg-slate-950/50 border-slate-700/60" : "",
        )}
        style={darkMode ? undefined : { background: "#F5FAFE", borderBottom: `1px solid ${iceBorder}` }}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-contain p-1.5 transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package size={22} className={darkMode ? "text-slate-600" : ""} style={darkMode ? undefined : { color: "#C1D8F0" }} />
          </div>
        )}

        <div className="absolute top-1.5 left-1.5">
          <span
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter shadow-xs"
            style={lowStock
              ? { background: "#FFF3E0", color: "#E65100", border: "1px solid #FFCC80" }
              : { background: "#E8F5E9", color: "#1B5E20", border: "1px solid #A5D6A7" }
            }
          >
            <div className={cn("w-1 h-1 rounded-full animate-pulse", lowStock ? "bg-orange-500" : "bg-green-500")} />
            {lowStock ? "Low" : "In Stock"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <h3
          className={cn("line-clamp-2 min-h-[2.6em] text-[11px] font-bold leading-snug", darkMode ? "text-slate-100" : "")}
          style={darkMode ? undefined : { color: darkText }}
        >
          {product.name}
        </h3>
        <p
          className={cn("mt-0.5 text-[9px] font-semibold", darkMode ? "text-slate-400" : "")}
          style={darkMode ? undefined : { color: mutedText }}
        >
          {product.sku}
        </p>

        <div className="mt-auto flex items-end justify-between pt-2">
          <p
            className="text-[13px] font-extrabold tabular-nums leading-none"
            style={{ color: iceBlue }}
          >
            {fmt(product.sellingPrice)}
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-90 shadow-sm cursor-pointer hover:opacity-80"
            style={{ background: iceBlue, color: "#FFFFFF" }}
          >
            <Plus size={13} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
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
  const iceBlue = "#146EF5";
  const darkText = "#10213D";
  const mutedText = "#64748B";
  const iceBorder = "#DCE8F2";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all cursor-pointer",
        darkMode ? "border border-slate-700 bg-slate-800 hover:border-blue-500/40 hover:shadow-md" : "hover:shadow-md",
      )}
      style={darkMode ? undefined : { background: "#FFFFFF", border: `1px solid ${iceBorder}` }}
      onClick={() => !disabled && onAdd()}
    >
      <div
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border",
          darkMode ? "bg-slate-900 border-slate-700" : "",
        )}
        style={darkMode ? undefined : { background: "#F5FAFE", border: `1px solid ${iceBorder}` }}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <Package size={22} className={darkMode ? "text-slate-500" : ""} style={darkMode ? undefined : { color: "#C1D8F0" }} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3
            className={cn("truncate text-[13px] font-bold", darkMode ? "text-slate-100" : "")}
            style={darkMode ? undefined : { color: darkText }}
          >
            {product.name}
          </h3>
          <CustomBadge tone={status.tone} className="!py-0.5 !text-[9px] !font-bold">
            <span className={cn("mr-1 inline-block h-1 w-1 rounded-full", status.dot)} />
            {status.label}
          </CustomBadge>
        </div>
        <p
          className={cn("text-[11px] font-medium mt-0.5", darkMode ? "text-slate-400" : "")}
          style={darkMode ? undefined : { color: mutedText }}
        >
          {product.sku}
        </p>
      </div>
      <p
        className="text-[15px] font-extrabold tabular-nums"
        style={{ color: iceBlue }}
      >
        {fmt(product.sellingPrice)}
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className="flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95 shadow-sm cursor-pointer hover:opacity-80"
        style={{ background: iceBlue, color: "#FFFFFF" }}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

