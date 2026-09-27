"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Truck, Store, Layers } from "lucide-react";
import { StoreConfig, ProductItem, CategoryItem } from "@/lib/api";
import DynamicProductCard from "@/components/products/DynamicProductCard";

interface GeneralStoreProps {
  config: StoreConfig;
  products: ProductItem[];
  categories: CategoryItem[];
}

export default function GeneralStore({ config, products, categories }: GeneralStoreProps) {
  const storeName = config.tenant.name || "Store";
  const businessType = config.businessType || "RETAIL";

  return (
    <div className="space-y-16 pb-20">
      {/* ── 1. GENERAL HERO BANNER ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.15),transparent_60%)]" />
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Online Store • Direct Real-Time Inventory</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Welcome to <br />
              <span className="bg-gradient-to-r from-sky-300 via-teal-200 to-indigo-200 bg-clip-text text-transparent">
                {storeName}
              </span>
            </h1>
            <p className="text-slate-300 text-base max-w-xl font-light">
              {config.tenant.tagline || `Shop quality authentic products directly from ${storeName} with instant dispatch and guaranteed genuine warranty.`}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/products"
                className="px-6 py-3.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center gap-2"
              >
                <span>Explore Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/products?sort=newest"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl backdrop-blur-md border border-white/15 transition-all"
              >
                New Arrivals
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex justify-end">
            <div className="relative w-80 h-80 rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-gradient-to-br from-sky-900/40 to-slate-900/80 p-6 flex flex-col justify-between backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-xl">
                <Store className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-widest text-sky-400 font-semibold">{businessType}</div>
                <div className="text-xl font-bold text-white">{storeName}</div>
                <div className="text-xs text-slate-300 pt-1">
                  ✓ Instant Order Processing • ✓ Verified Products
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. VALUE PROPS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Direct Dispatch</h4>
              <p className="text-xs text-slate-500">Shipped directly from our store inventory</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">100% Genuine Guaranteed</h4>
              <p className="text-xs text-slate-500">Authentic products with official warranty</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Multiple Payment Options</h4>
              <p className="text-xs text-slate-500">Cash on delivery, bKash, Nagad, Card</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. STORE CATEGORIES ── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Shop By Category</h2>
              <p className="text-sm text-slate-500 mt-1">Explore all categories available in our store</p>
            </div>
            <Link href="/products" className="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?categoryId=${cat.id}`}
                className="group flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-500/10 transition-all text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 group-hover:scale-110 flex items-center justify-center font-bold text-lg mb-3 transition-transform">
                  🏷️
                </div>
                <h4 className="text-sm font-semibold text-slate-800 group-hover:text-sky-600 transition-colors line-clamp-1">
                  {cat.name}
                </h4>
                <span className="text-[11px] text-slate-400 mt-0.5">{cat.productCount || 0} Products</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. PRODUCTS LIST ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Featured Products</h2>
            <p className="text-sm text-slate-500 mt-1">Latest items available from {storeName}</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
            <span>See All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <DynamicProductCard key={prod.id} product={prod} businessType={businessType} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <p className="text-slate-500">Products are currently being loaded into our catalogue.</p>
          </div>
        )}
      </section>
    </div>
  );
}
