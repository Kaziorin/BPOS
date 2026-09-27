"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Clock, Leaf, ShoppingCart, Apple } from "lucide-react";
import { StoreConfig, ProductItem, CategoryItem } from "@/lib/api";
import DynamicProductCard from "@/components/products/DynamicProductCard";

interface GroceryStoreProps {
  config: StoreConfig;
  products: ProductItem[];
  categories: CategoryItem[];
}

export default function GroceryStore({ config, products, categories }: GroceryStoreProps) {
  const storeName = config.tenant.name || "Daily Grocery & Supermarket";

  return (
    <div className="space-y-16 pb-20">
      {/* ── 1. GROCERY HERO BANNER ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              <Leaf className="w-3.5 h-3.5" />
              <span>100% Farm Fresh & Daily Essentials</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Fresh Groceries & Staples <br />
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
                Delivered in 2 Hours.
              </span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl font-light">
              Welcome to <strong className="text-white font-semibold">{storeName}</strong>. Shop fresh vegetables, fruits, dairy, rice, spices, and household essentials directly at wholesale prices.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/products"
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
              >
                <span>Shop Fresh Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/products?sort=popular"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl backdrop-blur-md border border-white/15 transition-all"
              >
                Popular Staples
              </Link>
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 space-y-2">
              <div className="text-3xl">🥦</div>
              <h4 className="font-bold text-white text-base">Farm Fresh Veggies</h4>
              <p className="text-xs text-slate-300">Cleaned and packed fresh daily</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 space-y-2">
              <div className="text-3xl">🥛</div>
              <h4 className="font-bold text-white text-base">Dairy & Beverages</h4>
              <p className="text-xs text-slate-300">Pure milk, butter and drinks</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. TRUST BADGES ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Fast 2-Hour Slot</h4>
              <p className="text-xs text-slate-500">Express neighborhood delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Freshness Guaranteed</h4>
              <p className="text-xs text-slate-500">100% replacement if not fresh</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Supermarket Pricing</h4>
              <p className="text-xs text-slate-500">Best market rates with daily deals</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. GROCERY AISLES ── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Supermarket Aisles</h2>
              <p className="text-sm text-slate-500 mt-1">Shop by your daily pantry needs</p>
            </div>
            <Link href="/products" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              <span>All Aisles</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?categoryId=${cat.id}`}
                className="group flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 transition-all text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 flex items-center justify-center font-bold text-lg mb-3 transition-transform">
                  🛒
                </div>
                <h4 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-1">
                  {cat.name}
                </h4>
                <span className="text-[11px] text-slate-400 mt-0.5">{cat.productCount || 0} Items</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. PRODUCTS LIST ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Essentials & Fresh Items</h2>
            <p className="text-sm text-slate-500 mt-1">Directly packed from {storeName}</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            <span>See All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <DynamicProductCard key={prod.id} product={prod} businessType="GROCERY" />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <p className="text-slate-500">Grocery products are loading into the store catalogue.</p>
          </div>
        )}
      </section>
    </div>
  );
}
