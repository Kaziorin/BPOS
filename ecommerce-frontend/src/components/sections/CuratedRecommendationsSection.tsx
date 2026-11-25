"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, ShoppingCart, ChevronRight, Check } from "lucide-react";
import { ProductItem } from "@/lib/api";
import { SectionItem } from "@/lib/builderTypes";
import { useCart } from "@/context/CartContext";
import { useStoreConfig } from "@/context/StoreConfigContext";
import toast from "react-hot-toast";

interface Props {
  section: SectionItem;
  products: ProductItem[];
  isDarkMode?: boolean;
}

export default function CuratedRecommendationsSection({ section, products, isDarkMode }: Props) {
  const { title, subtitle, badge, settings } = section;
  const { addToCart } = useCart();
  const { formatPrice } = useStoreConfig();
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  const getProductImage = (p: ProductItem, idx: number) => {
    if (p.imageUrl && !p.imageUrl.includes("photo-1523275335684-37898b6baf30")) return p.imageUrl;
    const n = (p.name || "").toLowerCase();
    if (n.includes("bread") || n.includes("wheat") || n.includes("loaf")) {
      return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80";
    }
    if (n.includes("chip") || n.includes("lays") || n.includes("snack")) {
      return "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80";
    }
    if (n.includes("coca") || n.includes("cola") || n.includes("drink")) {
      return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80";
    }
    const generalCurated = [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    ];
    return generalCurated[idx % generalCurated.length];
  };
  const limit = settings?.limit || 6;
  const displayProducts = products.slice(0, limit);

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

  return (
    <section className="py-6 sm:py-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            {badge && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 block mb-1">
                {badge}
              </span>
            )}
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title || "Just For You"}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 sm:gap-4">
          {displayProducts.map((p, idx) => {
            const isAdded = addedMap[p.id];
            return (
              <div
                key={p.id || idx}
                className={`group relative rounded-2xl overflow-hidden border p-3 flex flex-col justify-between shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                  isDarkMode
                    ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-white"
                    : "bg-white border-slate-200/80 hover:border-sky-300 text-slate-900"
                }`}
              >
                <Link href={`/products/${p.id}`} className="block relative h-32 sm:h-36 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 mb-2.5">
                  <img
                    src={getProductImage(p, idx)}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                <div>
                  <div className="flex items-center gap-1 text-[10px] text-amber-500 mb-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-semibold tabular-nums">4.7</span>
                  </div>

                  <Link href={`/products/${p.id}`}>
                    <h3 className="text-xs font-semibold line-clamp-2 leading-snug group-hover:text-sky-600 transition-colors">
                      {p.name}
                    </h3>
                  </Link>

                  <div className="mt-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                    {formatPrice(p.sellingPrice)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleAdd(p, e)}
                  className={`mt-2.5 w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors active:scale-98 shadow-2xs ${
                    isAdded
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 hover:bg-sky-600 text-white"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3 h-3" />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
