"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, Star, ShoppingCart, Eye, ChevronRight, Check } from "lucide-react";
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

export default function FlashSaleSection({ section, products, isDarkMode }: Props) {
  const { title, subtitle, settings } = section;
  const { addToCart } = useCart();
  const { formatPrice } = useStoreConfig();
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 24, seconds: 50 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 8, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const limit = settings?.limit || 6;
  const displayProducts = products.slice(0, limit);

  return (
    <section className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Flash Sale Header Bar */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl mb-6 shadow-xs border ${
            isDarkMode
              ? "bg-zinc-900 border-zinc-800 text-white"
              : "bg-gradient-to-r from-rose-50 via-orange-50/60 to-amber-50 border-rose-200/70 text-slate-900"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black">{title || "Flash Sale"}</h2>
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  {settings?.discountText || "UP TO 70% OFF"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {subtitle || "Top deals. Limited time only!"}
              </p>
            </div>
          </div>

          {/* Live Countdown Clock */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 mr-1 hidden sm:inline">
              Ending in:
            </span>
            <div className="flex items-center gap-1.5 font-mono text-xs font-black">
              <span className="bg-slate-900 text-white px-2.5 py-1.5 rounded-lg shadow-xs">
                {String(timeLeft.hours).padStart(2, "0")}h
              </span>
              <span className="text-slate-900 dark:text-white font-bold">:</span>
              <span className="bg-slate-900 text-white px-2.5 py-1.5 rounded-lg shadow-xs">
                {String(timeLeft.minutes).padStart(2, "0")}m
              </span>
              <span className="text-slate-900 dark:text-white font-bold">:</span>
              <span className="bg-rose-600 text-white px-2.5 py-1.5 rounded-lg shadow-xs animate-pulse">
                {String(timeLeft.seconds).padStart(2, "0")}s
              </span>
            </div>
            <Link
              href="/products?filter=flash-sale"
              className="ml-3 inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {displayProducts.map((p, idx) => {
            const originalPrice = Number(p.sellingPrice || 0) * 1.25;
            const discountPct = Math.round(((originalPrice - Number(p.sellingPrice)) / originalPrice) * 100);
            const isAdded = addedMap[p.id];

            return (
              <div
                key={p.id || idx}
                className={`group relative rounded-2xl overflow-hidden border p-3 flex flex-col justify-between shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                  isDarkMode
                    ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-white"
                    : "bg-white border-slate-200/80 hover:border-rose-300 text-slate-900"
                }`}
              >
                {/* Discount Badge */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                    -{discountPct || 20}%
                  </span>
                </div>

                {/* Product Image */}
                <Link href={`/products/${p.id}`} className="block relative h-36 sm:h-40 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 mb-3">
                  <img
                    src={p.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                </Link>

                {/* Info */}
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-amber-500 mb-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-bold">4.8</span>
                    <span className="text-slate-400 dark:text-zinc-500 text-[10px]">({120 + idx * 15})</span>
                  </div>

                  <Link href={`/products/${p.id}`}>
                    <h3 className="text-xs sm:text-sm font-bold line-clamp-2 leading-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {p.name}
                    </h3>
                  </Link>

                  {/* Price */}
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      {formatPrice(p.sellingPrice)}
                    </span>
                    <span className="text-[11px] text-slate-400 line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={(e) => handleAdd(p, e)}
                  className={`mt-3 w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs ${
                    isAdded
                      ? "bg-emerald-600 text-white"
                      : "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/10"
                  }`}
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

      </div>
    </section>
  );
}
