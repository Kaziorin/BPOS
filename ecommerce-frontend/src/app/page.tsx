"use client";

import React, { useEffect, useState } from "react";
import { StorefrontAPI, ProductItem, CategoryItem, StoreConfig } from "@/lib/api";
import FashionStore from "@/components/business-templates/FashionStore";
import PharmacyStore from "@/components/business-templates/PharmacyStore";
import GroceryStore from "@/components/business-templates/GroceryStore";
import RestaurantStore from "@/components/business-templates/RestaurantStore";
import GeneralStore from "@/components/business-templates/GeneralStore";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [featRes, catRes, confRes] = await Promise.all([
          StorefrontAPI.getProducts({ limit: 12, sort: "newest" }),
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-8 animate-pulse">
        <div className="h-72 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 bg-white rounded-3xl border border-slate-200 text-center shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-slate-800">Store Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">
          The requested store domain or subdomain could not be resolved. Please verify the URL or contact support.
        </p>
      </div>
    );
  }

  // Determine business type for dynamic UI
  const bType = (config.businessType || config.tenant?.businessType || "RETAIL").toUpperCase();

  switch (bType) {
    case "FASHION":
    case "FOOTWEAR":
    case "COSMETICS":
      return <FashionStore config={config} products={featuredProducts} categories={categories} />;

    case "PHARMACY":
    case "HEALTHCARE":
      return <PharmacyStore config={config} products={featuredProducts} categories={categories} />;

    case "GROCERY":
    case "SUPERMARKET":
      return <GroceryStore config={config} products={featuredProducts} categories={categories} />;

    case "RESTAURANT":
    case "CAFE":
    case "FOOD":
      return <RestaurantStore config={config} products={featuredProducts} categories={categories} />;

    default:
      return <GeneralStore config={config} products={featuredProducts} categories={categories} />;
  }
}
