"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Truck, Clock, Store, ArrowRight } from "lucide-react";
import { useStoreConfig } from "@/context/StoreConfigContext";

export default function AboutPage() {
  const { config, storeName, businessType } = useStoreConfig();
  const tagline =
    config?.tenant?.tagline ||
    `Direct online storefront of ${storeName}, synced in real time with in-store inventory.`;

  return (
    <div className="min-h-[70vh] bg-[#FAF8F5] text-stone-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header Card */}
        <section className="bg-white border border-stone-200 rounded-2xl p-8 sm:p-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">
            <Store className="w-3.5 h-3.5" />
            <span>{businessType} Storefront</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900">
            About {storeName}
          </h1>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-3xl">
            {tagline}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-colors"
            >
              <span>Browse Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold transition-colors"
            >
              <span>Contact Store</span>
            </Link>
          </div>
        </section>

        {/* Core Promises */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-stone-900">Authentic Catalog</h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              Every item, price, and stock count comes directly from {storeName}&apos;s live POS inventory.
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-stone-900">Direct Dispatch</h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              Orders go straight to the store fulfillment queue with real-time order tracking.
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-stone-900">Fast Support</h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              Reach our store team anytime via phone, email, or the live order tracking desk.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
