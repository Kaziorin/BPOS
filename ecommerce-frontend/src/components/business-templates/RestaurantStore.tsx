"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Clock, Utensils, Award, ChefHat } from "lucide-react";
import { StoreConfig, ProductItem, CategoryItem } from "@/lib/api";
import DynamicProductCard from "@/components/products/DynamicProductCard";

interface RestaurantStoreProps {
  config: StoreConfig;
  products: ProductItem[];
  categories: CategoryItem[];
}

export default function RestaurantStore({ config, products, categories }: RestaurantStoreProps) {
  const storeName = config.tenant.name || "Restaurant & Cafe";
  const [orderType, setOrderType] = useState<"DELIVERY" | "PICKUP" | "DINEIN">("DELIVERY");

  return (
    <div className="space-y-16 pb-20">
      {/* ── 1. RESTAURANT HERO BANNER ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-950 via-red-950 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-md">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Hot & Freshly Prepared Meals</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Delicious Food Delivered <br />
              <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent">
                Hot & Fresh to Your Door.
              </span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl font-light">
              Welcome to <strong className="text-white font-semibold">{storeName}</strong>. Choose your favorite gourmet burgers, platters, pizzas, drinks, and chef specials cooked fresh per order.
            </p>

            {/* Order Preference Switcher */}
            <div className="inline-flex p-1 bg-black/40 border border-white/20 rounded-2xl backdrop-blur-md">
              <button
                type="button"
                onClick={() => setOrderType("DELIVERY")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  orderType === "DELIVERY" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-300 hover:text-white"
                }`}
              >
                🛵 Delivery
              </button>
              <button
                type="button"
                onClick={() => setOrderType("PICKUP")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  orderType === "PICKUP" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-300 hover:text-white"
                }`}
              >
                🥡 Takeaway / Pickup
              </button>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/products"
                className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2"
              >
                <span>Explore Full Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 space-y-2">
              <div className="text-3xl">🍔</div>
              <h4 className="font-bold text-white text-base">Gourmet Burgers</h4>
              <p className="text-xs text-slate-300">Juicy patties & fresh brioche buns</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 space-y-2">
              <div className="text-3xl">🍕</div>
              <h4 className="font-bold text-white text-base">Woodfired Pizzas</h4>
              <p className="text-xs text-slate-300">Mozzarella & artisanal toppings</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. VALUE PROPS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Fast 30-Min Delivery</h4>
              <p className="text-xs text-slate-500">Thermal packed hot delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Master Chef Kitchen</h4>
              <p className="text-xs text-slate-500">Hygienic prep & premium ingredients</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Fresh To Order</h4>
              <p className="text-xs text-slate-500">Cooked right after confirmation</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FOOD MENU CATEGORIES ── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Menu Categories</h2>
              <p className="text-sm text-slate-500 mt-1">Appetizers, main courses, snacks & beverages</p>
            </div>
            <Link href="/products" className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">
              <span>View All Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?categoryId=${cat.id}`}
                className="group flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10 transition-all text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 group-hover:scale-110 flex items-center justify-center font-bold text-lg mb-3 transition-transform">
                  🍲
                </div>
                <h4 className="text-sm font-semibold text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-1">
                  {cat.name}
                </h4>
                <span className="text-[11px] text-slate-400 mt-0.5">{cat.productCount || 0} Dishes</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. POPULAR DISHES ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Popular Dishes & Specials</h2>
            <p className="text-sm text-slate-500 mt-1">Customer favorites at {storeName}</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">
            <span>Full Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <DynamicProductCard key={prod.id} product={prod} businessType="RESTAURANT" />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <p className="text-slate-500">Menu items are currently being prepared.</p>
          </div>
        )}
      </section>
    </div>
  );
}
