"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Layers,
  Flame,
  ShieldCheck,
  Truck,
  Store,
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { StorefrontAPI, ProductItem, CategoryItem, StoreConfig } from "@/lib/api";
import ProductCard from "@/components/products/ProductCard";

const BUSINESS_CARDS = [
  { id: "FASHION", name: "Fashion & Lifestyle", icon: "👗", desc: "Clothing, Dresses & Fabrics", color: "from-pink-500/10 to-rose-500/20 text-rose-600 border-rose-200" },
  { id: "GROCERY", name: "Grocery & Daily Needs", icon: "🛒", desc: "Fresh Items & Household", color: "from-emerald-500/10 to-teal-500/20 text-emerald-600 border-emerald-200" },
  { id: "PHARMACY", name: "Pharmacy & Healthcare", icon: "💊", desc: "Medicines & Supplements", color: "from-blue-500/10 to-cyan-500/20 text-sky-600 border-sky-200" },
  { id: "RESTAURANT", name: "Restaurant & Cafe", icon: "🍔", desc: "Meals, Burgers & Drinks", color: "from-amber-500/10 to-orange-500/20 text-amber-600 border-amber-200" },
  { id: "ELECTRONICS", name: "Electronics & Gadgets", icon: "⚡", desc: "Phones, Accessories & IT", color: "from-indigo-500/10 to-purple-500/20 text-indigo-600 border-indigo-200" },
  { id: "FOOTWEAR", name: "Footwear & Leather", icon: "👟", desc: "Shoes, Sneakers & Bags", color: "from-violet-500/10 to-purple-500/20 text-purple-600 border-purple-200" },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [featRes, catRes, confRes] = await Promise.all([
          StorefrontAPI.getProducts({ limit: 8, sort: "newest" }),
          StorefrontAPI.getCategories(),
          StorefrontAPI.getConfig(),
        ]);
        setFeaturedProducts(featRes.items || []);
        setCategories(catRes || []);
        setConfig(confRes || null);
      } catch (err) {
        console.error("Failed to load storefront homepage data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-12 pb-16">
      
      {/* ── 1. HERO SECTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-20 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-sky-300">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Omnichannel Shared Inventory Enabled</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
              Shop Store Products{" "}
              <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
                Directly Online
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
              Order from physical retail stores with live stock validation. Get express delivery to your doorstep or pick up in-store.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/products"
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-sky-500/30 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explore Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                href="/track-order"
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 backdrop-blur-md transition-all flex items-center gap-2"
              >
                <Truck className="w-4 h-4 text-sky-300" />
                <span>Track Your Order</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Genuine Retail Stock</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant POS Reservation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cash on Delivery & Online Pay</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card / Floating Badge */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl bg-gradient-to-tr from-white/10 to-white/5 p-6 border border-white/15 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{config?.tenant?.name || "BlueOceans Store"}</h3>
                    <p className="text-[11px] text-sky-300">Live POS Connected Backend</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                  ONLINE & SYNCED
                </span>
              </div>

              <div className="py-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                  <span>Supported Business Verticals</span>
                  <span className="font-bold text-sky-300">9 Active Types</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                  <span>Available Delivery Methods</span>
                  <span className="font-bold text-emerald-300">Home Delivery + Store Pickup</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                  <span>Instant Payment Gateway</span>
                  <span className="font-bold text-amber-300">bKash, Nagad, Cards & COD</span>
                </div>
              </div>

              <Link
                href="/products"
                className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span>Browse All Products</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. BUSINESS TYPES SHOWCASE ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sky-600 text-xs font-bold uppercase tracking-wider">
              <Layers className="w-4 h-4" /> Multi-Store Ecosystem
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Shop by Business Sector
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {BUSINESS_CARDS.map((item) => (
            <Link
              key={item.id}
              href={`/products?businessType=${item.id}`}
              className={`p-5 rounded-2xl bg-gradient-to-b ${item.color} border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between`}
            >
              <span className="text-3xl">{item.icon}</span>
              <div className="mt-4">
                <h3 className="text-xs font-bold text-slate-900 leading-tight">{item.name}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 3. FEATURED PRODUCTS GRID ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4" /> Fresh In Stock
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Trending & New Arrivals
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 group"
          >
            <span>Explore All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-72 bg-slate-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No active products found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Products created in the BlueOceans POS backend with &apos;ACTIVE&apos; status will show up here in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ── 4. PROMO BANNER ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-700 text-white p-8 md:p-12 shadow-xl shadow-sky-600/10">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider">
              Seamless Ordering
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Order Online, Pick Up in Store or Enjoy Express Delivery!
            </h3>
            <p className="text-xs sm:text-sm text-sky-100 font-normal leading-relaxed">
              Every purchase made online instantly syncs with the physical store POS counter. No delays, no stock discrepancies.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-sky-800 font-bold text-xs shadow-md hover:bg-slate-100 transition-colors"
              >
                <span>Shop All Items</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
