"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Truck, RotateCcw, Heart } from "lucide-react";
import { StoreConfig, ProductItem, CategoryItem } from "@/lib/api";
import DynamicProductCard from "@/components/products/DynamicProductCard";

interface FashionStoreProps {
  config: StoreConfig;
  products: ProductItem[];
  categories: CategoryItem[];
}

export default function FashionStore({ config, products, categories }: FashionStoreProps) {
  const storeName = config.tenant.name || "Fashion Boutique";

  return (
    <div className="space-y-16 pb-20">
      {/* ── 1. FASHION HERO BANNER ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(244,63,94,0.15),transparent_60%)]" />
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Season Trends & Lifestyle Collection</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Curated Style for <br />
              <span className="bg-gradient-to-r from-rose-300 via-pink-200 to-amber-200 bg-clip-text text-transparent">
                Every Occasion.
              </span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl font-light">
              Welcome to <strong className="text-white font-semibold">{storeName}</strong>. Explore premium fabrics, tailored fits, and trendy designer wear delivered directly to your doorstep.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/products"
                className="px-6 py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 transition-all flex items-center gap-2 group"
              >
                <span>Shop New Arrivals</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/products?sort=popular"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl backdrop-blur-md border border-white/15 transition-all"
              >
                View Best Sellers
              </Link>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="relative hidden lg:flex justify-end">
            <div className="relative w-80 h-96 rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-gradient-to-br from-rose-900/40 to-slate-900/80 p-6 flex flex-col justify-between backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full">Exclusive Style</span>
                <Heart className="w-5 h-5 text-rose-400" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-widest text-rose-300 font-semibold">{storeName}</div>
                <div className="text-xl font-bold text-white">Autumn / Festive Edition</div>
                <div className="flex items-center gap-2 pt-1 text-xs text-slate-300">
                  <span>✓ 100% Cotton & Silk</span>
                  <span>•</span>
                  <span>✓ Easy Exchange</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. VALUE PROPOSITIONS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Express Delivery</h4>
              <p className="text-xs text-slate-500">Fast doorstep shipping across the country</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">7 Days Easy Exchange</h4>
              <p className="text-xs text-slate-500">Size fitting replacement guarantee</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">100% Authentic Quality</h4>
              <p className="text-xs text-slate-500">Directly sourced & verified fabrics</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FASHION CATEGORIES ── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Explore Categories</h2>
              <p className="text-sm text-slate-500 mt-1">Browse by style, gender, and collection</p>
            </div>
            <Link href="/products" className="text-sm font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?categoryId=${cat.id}`}
                className="group flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-500/10 transition-all text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 group-hover:scale-110 flex items-center justify-center font-bold text-lg mb-3 transition-transform">
                  👗
                </div>
                <h4 className="text-sm font-semibold text-slate-800 group-hover:text-rose-600 transition-colors line-clamp-1">
                  {cat.name}
                </h4>
                <span className="text-[11px] text-slate-400 mt-0.5">{cat.productCount || 0} Items</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. FEATURED PRODUCTS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Trending Outfits & Collection</h2>
            <p className="text-sm text-slate-500 mt-1">Latest arrivals in stock right now</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1">
            <span>See All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <DynamicProductCard key={prod.id} product={prod} businessType="FASHION" />
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
