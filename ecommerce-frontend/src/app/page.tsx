"use client";

import React, { useEffect, useState } from "react";
import { StorefrontAPI, ProductItem, CategoryItem, StoreConfig } from "@/lib/api";
import { ThemeConfig, SectionItem, DEFAULT_VIBRANT_THEME } from "@/lib/builderTypes";
import { fetchActiveTheme } from "@/lib/builderStore";

// Section Components
import HeroSliderSection from "@/components/sections/HeroSliderSection";
import FeatureBadgesSection from "@/components/sections/FeatureBadgesSection";
import CategoryShowcaseSection from "@/components/sections/CategoryShowcaseSection";
import FlashSaleSection from "@/components/sections/FlashSaleSection";
import FeaturedCollectionsSection from "@/components/sections/FeaturedCollectionsSection";
import ProductGridSection from "@/components/sections/ProductGridSection";
import PromoSplitBannerSection from "@/components/sections/PromoSplitBannerSection";
import PromotionsSection from "@/components/sections/PromotionsSection";
import BrandsCarouselSection from "@/components/sections/BrandsCarouselSection";
import CuratedRecommendationsSection from "@/components/sections/CuratedRecommendationsSection";
import BlogStoriesSection from "@/components/sections/BlogStoriesSection";
import NewsletterSection from "@/components/sections/NewsletterSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import FaqSection from "@/components/sections/FaqSection";
import SpecialNoticeSection from "@/components/sections/SpecialNoticeSection";
import AppDownloadSection from "@/components/sections/AppDownloadSection";
import PharmacyUploadSection from "@/components/sections/PharmacyUploadSection";
import RestaurantMenuSection from "@/components/sections/RestaurantMenuSection";
import RichTextSection from "@/components/sections/RichTextSection";
import SidebarCategoryNav from "@/components/layout/SidebarCategoryNav";
import AdminBar from "@/components/layout/AdminBar";

export default function HomePage() {
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_VIBRANT_THEME);
  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [loadedTheme, featRes, catRes, confRes] = await Promise.all([
          fetchActiveTheme(),
          StorefrontAPI.getProducts({ limit: 16, sort: "newest" }),
          StorefrontAPI.getCategories(),
          StorefrontAPI.getConfig(),
        ]);
        setTheme(loadedTheme);
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
        <div className="h-96 bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-zinc-800 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const isDark = theme.isDarkMode;

  return (
    <div className={`min-h-screen ${isDark ? "bg-zinc-950 text-white" : "bg-white text-slate-900"}`}>
      {/* Admin Floating Bar if logged in as Admin */}
      <AdminBar />

      {/* Main Content Area: Supports Sidebar Layout vs Standard Full-width */}
      {theme.headerStyle === "sidebar_integrated" ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex gap-6">
          <SidebarCategoryNav categories={categories} isDarkMode={isDark} />
          <div className="flex-1 min-w-0 space-y-2">
            {theme.sections.map((sec) => {
              if (!sec.enabled) return null;
              return (
                <div key={sec.id}>
                  {renderStoreSection(sec, featuredProducts, categories, isDark)}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {theme.sections.map((sec) => {
            if (!sec.enabled) return null;
            return (
              <div key={sec.id}>
                {renderStoreSection(sec, featuredProducts, categories, isDark)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function renderStoreSection(
  sec: SectionItem,
  products: ProductItem[],
  categories: CategoryItem[],
  isDarkMode: boolean
) {
  switch (sec.type) {
    case "hero_slider":
      return <HeroSliderSection section={sec} isDarkMode={isDarkMode} />;
    case "feature_badges":
      return <FeatureBadgesSection section={sec} isDarkMode={isDarkMode} />;
    case "category_showcase":
      return <CategoryShowcaseSection section={sec} categories={categories} isDarkMode={isDarkMode} />;
    case "flash_sale":
      return <FlashSaleSection section={sec} products={products} isDarkMode={isDarkMode} />;
    case "featured_collections":
      return <FeaturedCollectionsSection section={sec} isDarkMode={isDarkMode} />;
    case "product_grid":
      return <ProductGridSection section={sec} products={products} isDarkMode={isDarkMode} />;
    case "promo_split_banner":
      return <PromoSplitBannerSection section={sec} isDarkMode={isDarkMode} />;
    case "promotions_section":
      return <PromotionsSection section={sec} isDarkMode={isDarkMode} />;
    case "brands_carousel":
      return <BrandsCarouselSection section={sec} isDarkMode={isDarkMode} />;
    case "curated_recommendations":
      return <CuratedRecommendationsSection section={sec} products={products} isDarkMode={isDarkMode} />;
    case "blog_stories":
      return <BlogStoriesSection section={sec} isDarkMode={isDarkMode} />;
    case "testimonials":
      return <TestimonialsSection section={sec} isDarkMode={isDarkMode} />;
    case "faq_section":
      return <FaqSection section={sec} isDarkMode={isDarkMode} />;
    case "special_notice":
      return <SpecialNoticeSection section={sec} isDarkMode={isDarkMode} />;
    case "app_download":
      return <AppDownloadSection section={sec} isDarkMode={isDarkMode} />;
    case "pharmacy_upload":
      return <PharmacyUploadSection section={sec} isDarkMode={isDarkMode} />;
    case "restaurant_menu":
      return <RestaurantMenuSection section={sec} isDarkMode={isDarkMode} />;
    case "rich_text":
      return <RichTextSection section={sec} isDarkMode={isDarkMode} />;
    case "newsletter":
      return <NewsletterSection section={sec} isDarkMode={isDarkMode} />;
    default:
      return null;
  }
}
