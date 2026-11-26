"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Heart, ChevronRight, Check } from "lucide-react";
import { ProductItem } from "@/lib/api";
import { SectionItem } from "@/lib/builderTypes";
import { useCart } from "@/context/CartContext";
import { useStoreConfig } from "@/context/StoreConfigContext";
import toast from "react-hot-toast";

interface Props {
  section: SectionItem;
  products: ProductItem[];
  isDarkMode?: boolean;
  hideCategoryTabs?: boolean;
  surfaceClass?: string;
}

export default function ProductGridSection({
  section,
  products,
  isDarkMode,
  hideCategoryTabs = false,
  surfaceClass,
}: Props) {
  const { title, subtitle, settings } = section;
  const { addToCart } = useCart();
  const { formatPrice } = useStoreConfig();

  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  const [wishlistMap, setWishlistMap] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const toggleWishlist = (p: ProductItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextSaved = !wishlistMap[p.id];
    setWishlistMap((prev) => ({ ...prev, [p.id]: nextSaved }));
    toast.success(nextSaved ? `${p.name} saved to wishlist!` : `${p.name} removed from wishlist.`);
  };

  const limit = settings?.limit || 12;
  const columns = settings?.columns || 4;

  // Filter products by category if configured or user selected
  let filteredProducts = products;
  if (settings?.categoryId) {
    filteredProducts = products.filter(
      (p) => (p as any).categoryId === settings.categoryId || p.productType === settings.categoryId
    );
  } else if (selectedCategory !== "All") {
    filteredProducts = products.filter(
      (p) =>
        p.categoryName === selectedCategory ||
        (p as any).category === selectedCategory ||
        p.productType === selectedCategory
    );
  }

  const displayProducts = (filteredProducts.length > 0 ? filteredProducts : products).slice(0, limit);

  const categoryNames = Array.from(
    new Set(products.map((p: any) => p.categoryName || p.category || p.productType).filter(Boolean))
  ).slice(0, 6) as string[];

  const handleAdd = (p: ProductItem, e: React.MouseEvent) => {
    e.preventDefault();
    if (p.totalStock !== undefined && Number(p.totalStock) <= 0) return;

    addToCart({
      productId: p.id,
      name: p.name,
      price: Number(p.sellingPrice || 0),
      qty: 1,
      imageUrl: p.imageUrl,
      sku: p.sku,
      unitName: p.unitName,
      maxStock: p.totalStock,
    });
    setAddedMap((prev) => ({ ...prev, [p.id]: true }));
    toast.success(`${p.name} added to cart!`);
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [p.id]: false }));
    }, 2000);
  };

  const getProductImage = (p: ProductItem, idx: number) => {
    if (p.imageUrl && !p.imageUrl.includes("photo-1523275335684-37898b6baf30")) return p.imageUrl;
    const n = (p.name || "").toLowerCase();
    if (n.includes("bread") || n.includes("wheat") || n.includes("loaf")) {
      return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80";
    }
    if (n.includes("chip") || n.includes("lays") || n.includes("snack") || n.includes("potato")) {
      return "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80";
    }
    if (n.includes("coca") || n.includes("cola") || n.includes("drink") || n.includes("soda") || n.includes("beverage")) {
      return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80";
    }
    if (n.includes("cake") || n.includes("croissant") || n.includes("pastry") || n.includes("bakery")) {
      return "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80";
    }
    if (n.includes("bun") || n.includes("burger")) {
      return "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80";
    }
    const generalCurated = [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80",
    ];
    return generalCurated[idx % generalCurated.length];
  };

  const GRID_COLS_BY_COUNT: Record<number, string> = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  };
  const gridColsClass = GRID_COLS_BY_COUNT[columns] || "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  const heading = (title || "Best Selling Products").trim();
  const words = heading.split(/\s+/);
  const headingHead = words.length > 1 ? words.slice(0, -1).join(" ") : "";
  const headingTail = words.length > 1 ? words[words.length - 1] : heading;

  const sectionSurface = surfaceClass || (isDarkMode ? "bg-zinc-950" : "bg-[#FAF8F5]");

  return (
    <section className={`py-8 sm:py-10 ${sectionSurface}`}>
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12">
        {/* Clean Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h2
              className={`text-xl sm:text-2xl font-semibold tracking-tight ${
                isDarkMode ? "!text-white" : "!text-stone-900"
              }`}
            >
              {headingHead ? (
                <>
                  {headingHead}{" "}
                  <span className="text-orange-600">{headingTail}</span>
                </>
              ) : (
                headingTail
              )}
            </h2>
            {subtitle && (
              <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? "!text-zinc-400" : "!text-stone-600"}`}>
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {!hideCategoryTabs && categoryNames.length > 1 && !settings?.categoryId && (
              <div className="hidden md:flex flex-wrap items-center gap-1.5">
                {["All", ...categoryNames].map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                        active
                          ? "bg-orange-600 border-orange-600 !text-white shadow-xs"
                          : isDarkMode
                          ? "bg-zinc-900 border-zinc-700 !text-zinc-300 hover:border-orange-500"
                          : "bg-white border-orange-200/80 !text-stone-700 hover:border-orange-400 hover:!text-orange-700"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}

            <Link
              href="/products"
              className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors shrink-0 ${
                isDarkMode
                  ? "bg-zinc-900 border-zinc-700 !text-zinc-200 hover:border-orange-500 hover:!text-orange-400"
                  : "bg-[#FFF1E0] border-orange-200/80 !text-orange-700 hover:bg-orange-600 hover:!text-white hover:border-orange-600"
              }`}
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Storefront-Themed KitchenPro Product Grid */}
        <div className={`grid gap-3.5 ${gridColsClass}`}>
          {displayProducts.map((p, idx) => {
            const isAdded = addedMap[p.id];
            const isSaved = wishlistMap[p.id];
            const inStock = p.totalStock === undefined || Number(p.totalStock) > 0;

            return (
              <article
                key={p.id || idx}
                className={`group relative rounded-xl overflow-hidden border flex flex-col transition-all ${
                  isDarkMode
                    ? "bg-zinc-900 border-zinc-800 hover:border-orange-500"
                    : "bg-white border-orange-200/80 hover:border-orange-500 hover:shadow-[0_8px_20px_rgba(234,88,12,0.08)]"
                }`}
              >
                {/* Edge-to-Edge Image Stage */}
                <div
                  className={`relative h-[195px] sm:h-[215px] w-full overflow-hidden ${
                    isDarkMode ? "bg-zinc-800" : "bg-[#FAF5EE]"
                  }`}
                >
                  <Link href={`/products/${p.id}`} className="block w-full h-full">
                    <img
                      src={getProductImage(p, idx)}
                      alt={p.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </Link>
                </div>

                {/* Single-line Title */}
                <Link href={`/products/${p.id}`} className="block px-3 pt-3 pb-1.5">
                  <h3
                    className={`text-[14px] font-semibold truncate leading-[1.35] transition-colors ${
                      isDarkMode
                        ? "!text-zinc-100 group-hover:!text-orange-400"
                        : "!text-stone-900 group-hover:!text-orange-600"
                    }`}
                  >
                    {p.name}
                  </h3>
                </Link>

                {/* Price + Unit */}
                <div className="px-3 flex items-baseline">
                  <span className="text-[15px] font-bold text-orange-600 tabular-nums">
                    {formatPrice(p.sellingPrice)}
                  </span>
                  <span className={`text-[11px] font-semibold ml-0.5 ${isDarkMode ? "!text-zinc-400" : "!text-stone-500"}`}>
                    /{p.unitName || "Pc"}
                  </span>
                </div>

                {/* Bottom Actions: Orange Add to Cart + Soft Peach Wishlist */}
                <div className="mt-auto px-3 pt-2.5 pb-3 flex items-stretch gap-2">
                  <button
                    type="button"
                    disabled={!inStock}
                    onClick={(e) => handleAdd(p, e)}
                    className={`flex-1 h-[38px] px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      !inStock
                        ? "bg-stone-200 !text-stone-500 cursor-not-allowed"
                        : isAdded
                        ? "bg-emerald-600 !text-white"
                        : "bg-orange-600 hover:bg-orange-700 !text-white"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" strokeWidth={2.2} />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-[15px] h-[15px]" strokeWidth={2.2} />
                        <span>{inStock ? "Add to Cart" : "Out of Stock"}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => toggleWishlist(p, e)}
                    aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
                    title={isSaved ? "Saved in wishlist" : "Save to wishlist"}
                    className={`w-[38px] h-[38px] shrink-0 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                      isSaved
                        ? "bg-rose-600 border-rose-600 hover:opacity-90 !text-white"
                        : isDarkMode
                        ? "bg-zinc-800 border-zinc-700 hover:border-orange-500 !text-orange-400"
                        : "bg-[#FFF1E0] border-orange-200 hover:bg-orange-100 hover:border-orange-300 !text-orange-600"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} strokeWidth={2} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
