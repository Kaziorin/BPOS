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
      <section className="bg-[#161816] text-stone-100 py-16 md:py-20 px-4 sm:px-6 lg:px-8 border-b border-stone-800">
        <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-800/90 border border-stone-700 text-stone-200 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Official storefront • Live store inventory</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-tight text-white">
              Shop directly from {storeName}
            </h1>
            <p className="text-stone-300 text-base max-w-xl leading-relaxed">
              {config.tenant.tagline || `Authentic products from ${storeName} with direct dispatch and real-time stock availability.`}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/products"
                className="px-6 py-3 bg-[#0F5132] hover:bg-[#0A3622] text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <span>Explore products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/products?sort=newest"
                className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-100 text-sm font-medium rounded-lg border border-stone-700 transition-colors"
              >
                New arrivals
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex justify-end">
            <div className="w-80 h-72 rounded-2xl border border-stone-800 bg-stone-900/90 p-6 flex flex-col justify-between">
              <div className="w-11 h-11 rounded-xl bg-[#0F5132]/30 border border-emerald-800/50 flex items-center justify-center text-emerald-300">
                <Store className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-stone-400">{businessType}</div>
                <div className="text-xl font-semibold text-white">{storeName}</div>
                <div className="text-xs text-stone-400 pt-1">
                  Direct order sync • Verified catalog
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. VALUE PROPS ── */}
      <section className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white p-6 rounded-xl border border-stone-200">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-stone-100 text-[#0F5132] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-900">Direct dispatch</h4>
              <p className="text-xs text-stone-500">Shipped straight from store stock</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-stone-100 text-[#0F5132] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-900">Verified catalog</h4>
              <p className="text-xs text-stone-500">Official store pricing and stock</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-stone-100 text-[#0F5132] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-900">Flexible checkout</h4>
              <p className="text-xs text-stone-500">Cash on delivery, bKash, Nagad, Card</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. STORE CATEGORIES ── */}
      {categories.length > 0 && (
        <section className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
      <section className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
