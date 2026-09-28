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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            {badge && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block mb-1">
                {badge}
              </span>
            )}
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {title || "Just For You"}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">{subtitle}</p>
            )}
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
          >
            <span>View All</span>
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
                    src={p.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                </Link>

                <div>
                  <div className="flex items-center gap-1 text-[10px] text-amber-500 mb-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-bold">4.7</span>
                  </div>

                  <Link href={`/products/${p.id}`}>
                    <h3 className="text-xs font-bold line-clamp-2 leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {p.name}
                    </h3>
                  </Link>

                  <div className="mt-2 text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    {formatPrice(p.sellingPrice)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleAdd(p, e)}
                  className={`mt-2.5 w-full py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${
                    isAdded
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 dark:bg-zinc-800 dark:text-zinc-200"
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
