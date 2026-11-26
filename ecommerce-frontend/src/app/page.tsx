"use client";

import React, { useEffect, useState } from "react";
import { StorefrontAPI, ProductItem, CategoryItem, StoreConfig } from "@/lib/api";
import { ThemeConfig, SectionItem, DEFAULT_VIBRANT_THEME } from "@/lib/builderTypes";
import { fetchActiveTheme } from "@/lib/builderStore";

// Section Components
import HeroSliderSection from "@/components/sections/HeroSliderSection";
import FeatureBadgesSection from "@/components/sections/FeatureBadgesSection";
import CategoryShowcaseSection from "@/components/sections/CategoryShowcaseSection";
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
        const params =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search)
            : null;
        const industryParam = params?.get("industry") || params?.get("businessType") || "";

        const [featRes, catRes, confRes] = await Promise.all([
          StorefrontAPI.getProducts({ limit: 16, sort: "newest" }),
          StorefrontAPI.getCategories(),
          StorefrontAPI.getConfig(),
        ]);
        const effectiveBizType =
          industryParam || confRes?.businessType || confRes?.tenant?.businessType || "RETAIL";
        const loadedTheme = await fetchActiveTheme(
          effectiveBizType,
          Boolean(industryParam)
        );
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
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 py-16 space-y-8 animate-pulse">
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
  const noticeSection = theme.sections.find((s) => s.type === "special_notice");
  const flashSaleSection = theme.sections.find((s) => s.type === "flash_sale");
  const visibleSections = theme.sections.filter(
    (s) => s.enabled && s.type !== "special_notice" && s.type !== "flash_sale"
  );

  return (
    <div className={`min-h-screen ${isDark ? "bg-zinc-950 text-white" : "bg-[#FAF8F5] text-stone-900"}`}>
      {/* Admin Floating Bar if logged in as Admin */}
      <AdminBar />

      {/* Main Content Area: Supports Sidebar Layout vs Standard Full-width */}
      {theme.headerStyle === "sidebar_integrated" ? (
        <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 py-4 sm:py-6 flex gap-6">
          <SidebarCategoryNav categories={categories} isDarkMode={isDark} />
          <div className="flex-1 min-w-0">
            {visibleSections.map((sec) => (
              <div key={sec.id}>
                {renderStoreSection(sec, featuredProducts, categories, isDark, noticeSection, flashSaleSection)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {visibleSections.map((sec) => (
            <div key={sec.id}>
              {renderStoreSection(sec, featuredProducts, categories, isDark, noticeSection, flashSaleSection)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderStoreSection(
  sec: SectionItem,
  products: ProductItem[],
  categories: CategoryItem[],
  isDarkMode: boolean,
  noticeSection?: SectionItem,
  flashSaleSection?: SectionItem
) {
  switch (sec.type) {
    case "hero_slider":
      return (
        <HeroSliderSection
          section={sec}
          noticeSection={noticeSection}
          flashSaleSection={flashSaleSection}
          isDarkMode={isDarkMode}
        />
      );
    case "feature_badges":
      return <FeatureBadgesSection section={sec} isDarkMode={isDarkMode} />;
    case "category_showcase":
      return <CategoryShowcaseSection section={sec} categories={categories} isDarkMode={isDarkMode} />;
    case "flash_sale":
      return null;
    case "featured_collections":
      return <FeaturedCollectionsSection section={sec} products={products} isDarkMode={isDarkMode} />;
    case "product_grid":
      return (
        <ProductGridSection
          section={sec}
          products={products}
          isDarkMode={isDarkMode}
          surfaceClass={isDarkMode ? "bg-zinc-900 border-y border-zinc-800" : "bg-white border-y border-orange-100"}
        />
      );
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
      return null;
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
