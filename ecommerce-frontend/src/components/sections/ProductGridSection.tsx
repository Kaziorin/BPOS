"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, ShoppingCart, Heart, Eye, ChevronRight, Check, Grid, List, Sparkles } from "lucide-react";
import { ProductItem } from "@/lib/api";
import { SectionItem } from "@/lib/builderTypes";
import { useCart } from "@/context/CartContext";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { useTheme } from "@/context/ThemeContext";
import ProductQuickViewModal from "@/components/common/ProductQuickViewModal";
import toast from "react-hot-toast";

interface Props {
  section: SectionItem;
  products: ProductItem[];
  isDarkMode?: boolean;
}

export default function ProductGridSection({ section, products, isDarkMode }: Props) {
  const { title, subtitle, badge, settings } = section;
  const { addToCart } = useCart();
  const { formatPrice } = useStoreConfig();
  const { primaryColor } = useTheme();

  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">(settings?.layout === "list" ? "list" : "grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);

  const limit = settings?.limit || 12;
  const columns = settings?.columns || 4;
  const showRating = settings?.showRating !== false;
  const showBadge = settings?.showBadge !== false;
  const showStock = settings?.showStock !== false;

  // Filter products by category if configured or user selected
  let filteredProducts = products;
  if (settings?.categoryId) {
    filteredProducts = products.filter(
      (p) => (p as any).categoryId === settings.categoryId || p.productType === settings.categoryId
    );
  } else if (selectedCategory !== "All") {
    filteredProducts = products.filter(
      (p) => (p as any).categoryName === selectedCategory || (p as any).category === selectedCategory || p.productType === selectedCategory
    );
  }

  const displayProducts = (filteredProducts.length > 0 ? filteredProducts : products).slice(0, limit);

  // Extract unique categories for filter tabs if enabled
  const categoryNames = Array.from(
    new Set(products.map((p: any) => p.categoryName || p.category || p.productType).filter(Boolean))
  ).slice(0, 6) as string[];

  const handleAdd = (p: ProductItem, e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      productId: p.id,
      name: p.name,
      price: Number(p.sellingPrice || 0),
      qty: 1,
      imageUrl: p.imageUrl,
      sku: p.sku,
    });
    setAddedMap((prev) => ({ ...prev, [p.id]: true }));
    toast.success(`${p.name} added to cart!`);
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [p.id]: false }));
    }, 2000);
  };

  // Determine grid columns classes
  const getGridColsClass = () => {
    switch (columns) {
      case 2:
        return "grid-cols-1 sm:grid-cols-2";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case 5:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
      case 6:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";
      case 4:
      default:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4";
    }
  };

  return (
    <section className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            {badge && (
              <span
                className="text-[11px] font-black uppercase tracking-wider block mb-1"
                style={{ color: primaryColor }}
              >
                {badge}
              </span>
            )}
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {title || "Featured Products"}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">{subtitle}</p>
            )}
          </div>

          {/* Right Controls: Category Filter Tabs, Layout Switcher & View All */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {categoryNames.length > 1 && !settings?.categoryId && (
              <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-full border border-slate-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === "All"
                      ? "text-white shadow-xs"
                      : "text-slate-600 dark:text-zinc-300 hover:text-slate-900"
                  }`}
                  style={selectedCategory === "All" ? { backgroundColor: primaryColor } : {}}
                >
                  All
                </button>
                {categoryNames.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? "text-white shadow-xs"
                        : "text-slate-600 dark:text-zinc-300 hover:text-slate-900"
                    }`}
                    style={selectedCategory === cat ? { backgroundColor: primaryColor } : {}}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Layout Mode Switcher (Grid / List) */}
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-slate-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs font-bold"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                }`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === "list"
                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs font-bold"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-xs font-bold transition-colors ml-1"
              style={{ color: primaryColor }}
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── MODE 1: LIST VIEW ── */}
        {viewMode === "list" ? (
          <div className="space-y-3">
            {displayProducts.map((p, idx) => {
              const isAdded = addedMap[p.id];
              const originalPrice = Number(p.sellingPrice || 0) * 1.25;

              return (
                <div
                  key={p.id || idx}
                  className={`group rounded-2xl overflow-hidden border p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs hover:shadow-lg transition-all duration-200 ${
                    isDarkMode
                      ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-white"
                      : "bg-white border-slate-200/90 hover:border-slate-300 text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    {/* Image */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0">
                      <Link href={`/products/${p.id}`} className="block w-full h-full">
                        <img
                          src={p.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80"}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </Link>
                    </div>

                    {/* Meta Details */}
                    <div>
                      {showRating && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-500 mb-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="font-bold">4.9</span>
                          <span className="text-slate-400 text-[10px]">({120 + idx * 15} reviews)</span>
                        </div>
                      )}

                      <Link href={`/products/${p.id}`}>
                        <h3 className="text-sm sm:text-base font-bold line-clamp-1 hover:underline">
                          {p.name}
                        </h3>
                      </Link>

                      {p.sku && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          SKU: {p.sku}
                        </span>
                      )}

                      {showStock && p.totalStock !== undefined && (
                        <div className="mt-1.5">
                          {Number(p.totalStock) > 0 ? (
                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              In Stock ({p.totalStock} available)
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Pre-Order
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price and Add Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-zinc-800">
                    <div className="text-left sm:text-right">
                      <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                        {formatPrice(p.sellingPrice)}
                      </div>
                      <div className="text-xs text-slate-400 line-through">
                        {formatPrice(originalPrice)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAdd(p, e)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs ${
                        isAdded
                          ? "bg-emerald-600 text-white"
                          : "text-white"
                      }`}
                      style={!isAdded ? { backgroundColor: primaryColor } : {}}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── MODE 2: GRID VIEW ── */
          <div className={`grid gap-4 sm:gap-5 ${getGridColsClass()}`}>
            {displayProducts.map((p, idx) => {
              const isAdded = addedMap[p.id];
              const originalPrice = Number(p.sellingPrice || 0) * 1.25;

              return (
                <div
                  key={p.id || idx}
                  className={`group relative rounded-2xl overflow-hidden border p-3.5 flex flex-col justify-between shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                    isDarkMode
                      ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-white"
                      : "bg-white border-slate-200/80 text-slate-900"
                  }`}
                  style={{ borderColor: undefined }}
                >
                  {/* Image */}
                  <div className="relative h-44 sm:h-48 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 mb-3.5">
                    <Link href={`/products/${p.id}`} className="block w-full h-full">
                      <img
                        src={p.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      />
                    </Link>

                    {/* Stock status badge */}
                    {showStock && p.totalStock !== undefined && (
                      <div className="absolute top-2.5 left-2.5">
                        {Number(p.totalStock) > 0 ? (
                          <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs">
                            In Stock
                          </span>
                        ) : (
                          <span className="bg-slate-700 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs">
                            Pre-Order
                          </span>
                        )}
                      </div>
                    )}

                    {/* Discount badge */}
                    {showBadge && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs">
                          -20%
                        </span>
                      </div>
                    )}
                    {/* Quick View Button on Hover */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setQuickViewProduct(p);
                      }}
                      className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-xl bg-slate-900/90 hover:bg-sky-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-105 active:scale-95"
                      title="Quick View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Info */}
                  <div>
                    {showRating && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-500 mb-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold">4.8</span>
                        <span className="text-slate-400 dark:text-zinc-500 text-[10px]">
                          ({240 + idx * 30} sold)
                        </span>
                      </div>
                    )}

                    <Link href={`/products/${p.id}`}>
                      <h3 className="text-xs sm:text-sm font-bold line-clamp-2 leading-tight hover:underline">
                        {p.name}
                      </h3>
                    </Link>

                    {/* Price */}
                    <div className="mt-2.5 flex items-baseline gap-2">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {formatPrice(p.sellingPrice)}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        {formatPrice(originalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart button */}
                  <button
                    type="button"
                    onClick={(e) => handleAdd(p, e)}
                    className={`mt-3.5 w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs ${
                      isAdded
                        ? "bg-emerald-600 text-white"
                        : "text-white"
                    }`}
                    style={
                      !isAdded
                        ? {
                            backgroundColor: primaryColor,
                            boxShadow: `0 4px 12px ${primaryColor}30`,
                          }
                        : {}
                    }
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </section>
  );
}
