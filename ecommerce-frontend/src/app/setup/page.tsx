"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sliders,
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle2,
  Store,
  Layers,
  Flame,
  LayoutGrid,
  ShoppingBag,
  Tag,
  Palette,
  Settings,
  ChevronRight,
  ShieldCheck,
  Globe,
} from "lucide-react";
import {
  ThemeConfig,
  SectionItem,
  SectionType,
  DEFAULT_VIBRANT_THEME,
  DEFAULT_SIDEBAR_THEME,
  DEFAULT_DARK_LUXURY_THEME,
} from "@/lib/builderTypes";
import { fetchActiveTheme, saveActiveTheme, getPresetTheme } from "@/lib/builderStore";
import { StorefrontAPI, ProductItem, CategoryItem, StoreConfig } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

// Section Components for Live Preview
import HeroSliderSection from "@/components/sections/HeroSliderSection";
import FeatureBadgesSection from "@/components/sections/FeatureBadgesSection";
import CategoryShowcaseSection from "@/components/sections/CategoryShowcaseSection";
import FlashSaleSection from "@/components/sections/FlashSaleSection";
import FeaturedCollectionsSection from "@/components/sections/FeaturedCollectionsSection";
import ProductGridSection from "@/components/sections/ProductGridSection";
import PromoSplitBannerSection from "@/components/sections/PromoSplitBannerSection";
import BrandsCarouselSection from "@/components/sections/BrandsCarouselSection";
import CuratedRecommendationsSection from "@/components/sections/CuratedRecommendationsSection";
import BlogStoriesSection from "@/components/sections/BlogStoriesSection";
import NewsletterSection from "@/components/sections/NewsletterSection";
import SidebarCategoryNav from "@/components/layout/SidebarCategoryNav";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function SetupPage() {
  const router = useRouter();
  const { isAdmin, adminUser } = useAuth();

  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_VIBRANT_THEME);
  const [activeTab, setActiveTab] = useState<"sections" | "presets" | "styles">("sections");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>("sec-hero-1");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Store data for live preview
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [config, setConfig] = useState<StoreConfig | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [loadedTheme, prods, cats, conf] = await Promise.all([
          fetchActiveTheme(),
          StorefrontAPI.getProducts({ limit: 12 }),
          StorefrontAPI.getCategories(),
          StorefrontAPI.getConfig(),
        ]);
        setTheme(loadedTheme);
        setProducts(prods.items || []);
        setCategories(cats || []);
        setConfig(conf || null);
        if (loadedTheme.sections && loadedTheme.sections.length > 0) {
          setSelectedSectionId(loadedTheme.sections[0].id);
        }
      } catch (e) {
        console.error("Failed to load setup data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Section Management Handlers
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...theme.sections];
    const temp = newSections[index - 1];
    newSections[index - 1] = newSections[index];
    newSections[index] = temp;
    setTheme({ ...theme, sections: newSections });
  };

  const handleMoveDown = (index: number) => {
    if (index === theme.sections.length - 1) return;
    const newSections = [...theme.sections];
    const temp = newSections[index + 1];
    newSections[index + 1] = newSections[index];
    newSections[index] = temp;
    setTheme({ ...theme, sections: newSections });
  };

  const handleToggleVisible = (id: string) => {
    const newSections = theme.sections.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    setTheme({ ...theme, sections: newSections });
  };

  const handleDeleteSection = (id: string) => {
    const newSections = theme.sections.filter((s) => s.id !== id);
    setTheme({ ...theme, sections: newSections });
    if (selectedSectionId === id) {
      setSelectedSectionId(newSections[0]?.id || null);
    }
    toast.success("Section removed");
  };

  const handleAddSection = (type: SectionType) => {
    const newId = `sec-${type}-${Date.now()}`;
    let newSec: SectionItem = {
      id: newId,
      type,
      title: "New Section",
      subtitle: "Customize this section subtitle",
      badge: "FEATURED",
      enabled: true,
      settings: {},
    };

    if (type === "hero_slider") {
      newSec = {
        ...newSec,
        title: "Modern Lifestyle Essentials",
        subtitle: "Discover curated collections with fast home delivery.",
        settings: {
          ctaText: "Shop Now",
          ctaLink: "/products",
          sideDealTitle: "Flash Deal",
          sideDealBadge: "Up to 60% OFF",
          sideDealSubtitle: "Limited Time Only",
          heroImage: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&auto=format&fit=crop&q=80",
        },
      };
    } else if (type === "flash_sale") {
      newSec = {
        ...newSec,
        title: "Flash Sale",
        subtitle: "Limited time exclusive discounts",
        settings: { hoursLeft: 6, discountText: "UP TO 50% OFF", limit: 6 },
      };
    } else if (type === "category_showcase") {
      newSec = {
        ...newSec,
        title: "Shop by Category",
        settings: { style: "circles", limit: 8 },
      };
    } else if (type === "product_grid") {
      newSec = {
        ...newSec,
        title: "Top Trending Products",
        settings: { filter: "all", limit: 8, columns: 4 },
      };
    }

    setTheme({ ...theme, sections: [...theme.sections, newSec] });
    setSelectedSectionId(newId);
    toast.success("New section added!");
  };

  const handleUpdateSelected = (field: string, val: any) => {
    if (!selectedSectionId) return;
    const newSections = theme.sections.map((s) => {
      if (s.id !== selectedSectionId) return s;
      if (field.startsWith("settings.")) {
        const key = field.replace("settings.", "");
        return {
          ...s,
          settings: { ...s.settings, [key]: val },
        };
      }
      return { ...s, [field]: val };
    });
    setTheme({ ...theme, sections: newSections });
  };

  const handleApplyPreset = (preset: "shopease-vibrant" | "shopease-sidebar-grocery" | "shopease-dark-luxury") => {
    const loaded = getPresetTheme(preset);
    setTheme(loaded);
    setSelectedSectionId(loaded.sections[0]?.id || null);
    toast.success(`Applied ${preset} preset!`);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveActiveTheme(theme);
      toast.success("🎉 Storefront layout and theme published successfully!");
    } catch (err) {
      toast.error("Failed to save theme");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedSection = theme.sections.find((s) => s.id === selectedSectionId);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* Top Builder Control Bar */}
      <header className="h-16 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between z-40 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-black text-white hover:text-sky-400 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              <Sliders className="w-4 h-4" />
            </div>
            <span className="text-base font-black">ShopEase Visual Builder</span>
          </Link>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Live Setup Mode
          </span>
        </div>

        {/* Viewport Switcher */}
        <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-full p-1 gap-1">
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            className={`p-1.5 rounded-full transition-colors ${
              viewport === "desktop" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="Desktop View"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewport("tablet")}
            className={`p-1.5 rounded-full transition-colors ${
              viewport === "tablet" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="Tablet View"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewport("mobile")}
            className={`p-1.5 rounded-full transition-colors ${
              viewport === "mobile" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Save and Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Live Store</span>
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/20 transition-transform active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Publishing..." : "Save & Publish"}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace (Left Sidebar + Right Live Canvas) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Inspector / Settings Panel */}
        <aside className="w-80 sm:w-96 bg-slate-950/95 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-800 text-xs font-bold text-slate-400">
            <button
              type="button"
              onClick={() => setActiveTab("sections")}
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === "sections"
                  ? "border-sky-500 text-sky-400 bg-slate-900/50"
                  : "border-transparent hover:text-slate-200"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Sections</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("presets")}
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === "presets"
                  ? "border-sky-500 text-sky-400 bg-slate-900/50"
                  : "border-transparent hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Presets</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("styles")}
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === "styles"
                  ? "border-sky-500 text-sky-400 bg-slate-900/50"
                  : "border-transparent hover:text-slate-200"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Styles</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            
            {/* TAB 1: SECTIONS & DRAG REORDER */}
            {activeTab === "sections" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Page Layout & Order ({theme.sections.length})
                  </h3>
                </div>

                {/* Section Reorderable List */}
                <div className="space-y-2">
                  {theme.sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      onClick={() => setSelectedSectionId(sec.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedSectionId === sec.id
                          ? "bg-sky-950/60 border-sky-500 shadow-md text-white"
                          : "bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300"
                      } ${!sec.enabled ? "opacity-40" : ""}`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-[10px] font-mono text-slate-500 w-4">{idx + 1}</span>
                        <div className="truncate">
                          <h4 className="text-xs font-bold truncate">
                            {sec.title || sec.type.replace(/_/g, " ").toUpperCase()}
                          </h4>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                            {sec.type}
                          </span>
                        </div>
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === theme.sections.length - 1}
                          className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleVisible(sec.id)}
                          className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
                          title={sec.enabled ? "Hide Section" : "Show Section"}
                        >
                          {sec.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(sec.id)}
                          className="p-1 rounded-md hover:bg-rose-950 text-rose-400 hover:text-rose-300"
                          title="Delete Section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Section Quick Trigger */}
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    ➕ Add New Section
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddSection("hero_slider")}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 text-xs font-semibold text-slate-300 text-left transition-colors"
                    >
                      Hero Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("flash_sale")}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 text-xs font-semibold text-slate-300 text-left transition-colors"
                    >
                      Flash Sale Deals
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("category_showcase")}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 text-xs font-semibold text-slate-300 text-left transition-colors"
                    >
                      Categories Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("product_grid")}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 text-xs font-semibold text-slate-300 text-left transition-colors"
                    >
                      Products Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("featured_collections")}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 text-xs font-semibold text-slate-300 text-left transition-colors"
                    >
                      Bento Collections
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("promo_split_banner")}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 text-xs font-semibold text-slate-300 text-left transition-colors"
                    >
                      Promo Split Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("brands_carousel")}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 text-xs font-semibold text-slate-300 text-left transition-colors"
                    >
                      Brands Bar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection("newsletter")}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 text-xs font-semibold text-slate-300 text-left transition-colors"
                    >
                      Newsletter Box
                    </button>
                  </div>
                </div>

                {/* Section Inspector Properties Form */}
                {selectedSection && (
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5" />
                      <span>Edit: {selectedSection.title || selectedSection.type}</span>
                    </h4>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Section Title</label>
                      <input
                        type="text"
                        value={selectedSection.title || ""}
                        onChange={(e) => handleUpdateSelected("title", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Subtitle / Tagline</label>
                      <input
                        type="text"
                        value={selectedSection.subtitle || ""}
                        onChange={(e) => handleUpdateSelected("subtitle", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Badge Tag</label>
                      <input
                        type="text"
                        value={selectedSection.badge || ""}
                        onChange={(e) => handleUpdateSelected("badge", e.target.value)}
                        placeholder="e.g. NEW ARRIVAL, POPULAR"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-sky-500"
                      />
                    </div>

                    {/* Specific settings based on section type */}
                    {selectedSection.type === "hero_slider" && (
                      <>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Button Text</label>
                          <input
                            type="text"
                            value={selectedSection.settings?.ctaText || "Shop Now"}
                            onChange={(e) => handleUpdateSelected("settings.ctaText", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Side Deal Title</label>
                          <input
                            type="text"
                            value={selectedSection.settings?.sideDealTitle || "Flash Deal"}
                            onChange={(e) => handleUpdateSelected("settings.sideDealTitle", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Side Deal Discount</label>
                          <input
                            type="text"
                            value={selectedSection.settings?.sideDealBadge || "Up to 70% OFF"}
                            onChange={(e) => handleUpdateSelected("settings.sideDealBadge", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                          />
                        </div>
                      </>
                    )}

                    {selectedSection.type === "category_showcase" && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Category Layout Style</label>
                        <select
                          value={selectedSection.settings?.style || "circles"}
                          onChange={(e) => handleUpdateSelected("settings.style", e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                        >
                          <option value="circles">Circular Pastel Icons (Reference 1 & 5)</option>
                          <option value="cards">Bordered Category Cards (Reference 2 & 3)</option>
                          <option value="pills">Rounded Capsule Pills</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PRESET TEMPLATES */}
            {activeTab === "presets" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                    1-Click Design Presets
                  </h3>
                  <p className="text-xs text-slate-500">
                    Switch entire store template based on your provided ShopEase reference designs.
                  </p>
                </div>

                {/* Preset 1: Vibrant Mega Store */}
                <div
                  onClick={() => handleApplyPreset("shopease-vibrant")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    theme.themePreset === "shopease-vibrant"
                      ? "bg-sky-950/60 border-sky-500 shadow-md text-white"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-sky-400">1. ShopEase Vibrant Mega Store</span>
                    {theme.themePreset === "shopease-vibrant" && (
                      <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Hero Slider with side 70% Flash Deal countdown card, Circular category pastel icons, Flash Sale carousel, Bento Collections, Best Selling products & Brand Logos.
                  </p>
                </div>

                {/* Preset 2: Sidebar & Grocery */}
                <div
                  onClick={() => handleApplyPreset("shopease-sidebar-grocery")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    theme.themePreset === "shopease-sidebar-grocery"
                      ? "bg-emerald-950/60 border-emerald-500 shadow-md text-white"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-emerald-400">2. ShopEase Sidebar & Grocery</span>
                    {theme.themePreset === "shopease-sidebar-grocery" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Left Sidebar with full categories tree & App download box, Top Selling products, 4-Box Category Cards, Wide Promo Banner & Lifestyle Blog.
                  </p>
                </div>

                {/* Preset 3: Dark Luxury */}
                <div
                  onClick={() => handleApplyPreset("shopease-dark-luxury")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    theme.themePreset === "shopease-dark-luxury"
                      ? "bg-amber-950/60 border-amber-500 shadow-md text-white"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-amber-400">3. ShopEase Dark Luxury & Fashion</span>
                    {theme.themePreset === "shopease-dark-luxury" && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Dark theme with "Style Meets Lifestyle" Hero, Gold accents, Circular fashion pills, Split showcase cards (iPhone 15 + Luxury Fashion) & Private drops.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: GLOBAL STYLING */}
            {activeTab === "styles" && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Global Branding & Colors
                </h3>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Color Theme Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTheme({ ...theme, isDarkMode: false })}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                        !theme.isDarkMode
                          ? "bg-white text-slate-900 border-sky-500 shadow-sm"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      ☀️ Light Modern
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme({ ...theme, isDarkMode: true })}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                        theme.isDarkMode
                          ? "bg-zinc-950 text-white border-amber-500 shadow-sm"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      🌙 Dark Luxury
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Header Layout</label>
                  <select
                    value={theme.headerStyle}
                    onChange={(e) => setTheme({ ...theme, headerStyle: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                  >
                    <option value="standard">Standard Header with Categories Bar</option>
                    <option value="sidebar_integrated">Left Category Sidebar Layout</option>
                    <option value="dark_luxury">Dark Luxury Minimal Header</option>
                  </select>
                </div>
              </div>
            )}

          </div>

        </aside>

        {/* Right Live Interactive Canvas */}
        <main className="flex-1 bg-slate-950 overflow-y-auto p-4 sm:p-6 flex items-start justify-center">
          <div
            className={`transition-all duration-300 shadow-2xl rounded-3xl overflow-hidden border border-slate-800 ${
              theme.isDarkMode ? "bg-zinc-950 text-white" : "bg-white text-slate-900"
            }`}
            style={{
              width:
                viewport === "mobile"
                  ? "375px"
                  : viewport === "tablet"
                  ? "768px"
                  : "100%",
              maxWidth: "1440px",
              minHeight: "800px",
            }}
          >
            {/* Storefront Header */}
            <Navbar isDarkMode={theme.isDarkMode} />

            {/* Layout Wrapper: Standard vs Sidebar mode */}
            {theme.headerStyle === "sidebar_integrated" ? (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-6">
                <SidebarCategoryNav categories={categories} isDarkMode={theme.isDarkMode} />
                <div className="flex-1 min-w-0 space-y-4">
                  {theme.sections.map((sec) => {
                    if (!sec.enabled) return null;
                    return (
                      <div
                        key={sec.id}
                        onClick={() => setSelectedSectionId(sec.id)}
                        className={`relative group rounded-3xl transition-all ${
                          selectedSectionId === sec.id
                            ? "ring-2 ring-sky-500 ring-offset-2 ring-offset-slate-900"
                            : "hover:ring-1 hover:ring-sky-400/40"
                        }`}
                      >
                        {renderSection(sec, products, categories, theme.isDarkMode)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {theme.sections.map((sec) => {
                  if (!sec.enabled) return null;
                  return (
                    <div
                      key={sec.id}
                      onClick={() => setSelectedSectionId(sec.id)}
                      className={`relative group transition-all ${
                        selectedSectionId === sec.id
                          ? "ring-2 ring-sky-500"
                          : "hover:ring-1 hover:ring-sky-400/40"
                      }`}
                    >
                      {renderSection(sec, products, categories, theme.isDarkMode)}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <Footer />
          </div>
        </main>

      </div>
    </div>
  );
}

function renderSection(
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
    case "brands_carousel":
      return <BrandsCarouselSection section={sec} isDarkMode={isDarkMode} />;
    case "curated_recommendations":
      return <CuratedRecommendationsSection section={sec} products={products} isDarkMode={isDarkMode} />;
    case "blog_stories":
      return <BlogStoriesSection section={sec} isDarkMode={isDarkMode} />;
    case "newsletter":
      return <NewsletterSection section={sec} isDarkMode={isDarkMode} />;
    default:
      return null;
  }
}
