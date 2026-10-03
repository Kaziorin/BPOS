"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Copy,
  Plus,
  ArrowUp,
  ArrowDown,
  GripVertical,
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
  Utensils,
  Pill,
  Shirt,
  Tv,
  HelpCircle,
  Star,
  Download,
  UploadCloud,
  FileText,
  Bell,
  RefreshCw,
  FileDown,
  FileUp,
  Check,
  Type,
  Maximize2,
  Move,
  Layout,
} from "lucide-react";
import {
  ThemeConfig,
  SectionItem,
  SectionType,
  BusinessPresetId,
  DEFAULT_VIBRANT_THEME,
  DEFAULT_SIDEBAR_THEME,
  DEFAULT_DARK_LUXURY_THEME,
  DEFAULT_ELECTRONICS_THEME,
  DEFAULT_FASHION_THEME,
  DEFAULT_PHARMACY_THEME,
  DEFAULT_RESTAURANT_THEME,
  DEFAULT_BEAUTY_THEME,
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
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import FaqSection from "@/components/sections/FaqSection";
import SpecialNoticeSection from "@/components/sections/SpecialNoticeSection";
import AppDownloadSection from "@/components/sections/AppDownloadSection";
import PharmacyUploadSection from "@/components/sections/PharmacyUploadSection";
import RestaurantMenuSection from "@/components/sections/RestaurantMenuSection";
import RichTextSection from "@/components/sections/RichTextSection";
import SidebarCategoryNav from "@/components/layout/SidebarCategoryNav";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Section Meta Definition for Library
interface SectionMeta {
  type: SectionType;
  title: string;
  category: "core" | "products" | "business" | "content";
  icon: string;
  desc: string;
  badge?: string;
}

const SECTION_LIBRARY: SectionMeta[] = [
  // Core
  {
    type: "hero_slider",
    title: "Hero Banner & Slider",
    category: "core",
    icon: "🎯",
    desc: "Large prominent banner with CTA button, promo tag & side deal card.",
  },
  {
    type: "feature_badges",
    title: "Trust Badges & Highlights",
    category: "core",
    icon: "🛡️",
    desc: "4 highlight cards for Free Shipping, Warranty, Returns & 24/7 Support.",
  },
  {
    type: "category_showcase",
    title: "Category Grid & Showcase",
    category: "core",
    icon: "📁",
    desc: "Visual category browser (Circles, Cards or Capsule Pills).",
  },
  {
    type: "newsletter",
    title: "Newsletter & VIP Signup",
    category: "core",
    icon: "✉️",
    desc: "Email capture box for promotions, discount codes and updates.",
  },

  // Products
  {
    type: "product_grid",
    title: "Dynamic Product Grid",
    category: "products",
    icon: "🛍️",
    desc: "Customizable 2/3/4/5/6 columns grid with category filter & limit.",
  },
  {
    type: "flash_sale",
    title: "Flash Sale & Countdown Deals",
    category: "products",
    icon: "⚡",
    desc: "Urgent limited-time offers with live countdown timer and discounts.",
  },
  {
    type: "featured_collections",
    title: "Bento Multi-Card Collections",
    category: "products",
    icon: "🍱",
    desc: "Modern asymmetric Bento grid cards for high-margin departments.",
  },
  {
    type: "curated_recommendations",
    title: "Curated Recommendations",
    category: "products",
    icon: "✨",
    desc: "Personalized 'Just for you' product carousel.",
  },
  {
    type: "promo_split_banner",
    title: "Promo Split Showcase Banner",
    category: "products",
    icon: "🎨",
    desc: "High-contrast promotional visual banner with side cards & CTAs.",
  },

  // Business Specials
  {
    type: "restaurant_menu",
    title: "Restaurant Menu & Food Specials",
    category: "business",
    icon: "🍔",
    desc: "Gourmet dish menu with category tabs, prep time, price and 1-click add to cart.",
    badge: "Food & Cafe",
  },
  {
    type: "pharmacy_upload",
    title: "Prescription Upload & Rx Dispatch",
    category: "business",
    icon: "💊",
    desc: "Direct drag & drop file upload for medical prescriptions & pharmacist review.",
    badge: "Pharmacy",
  },
  {
    type: "brands_carousel",
    title: "Brand Logo Partners Bar",
    category: "business",
    icon: "🏷️",
    desc: "Clean brand logos carousel building trust and partner credibility.",
  },
  {
    type: "app_download",
    title: "Mobile App Download Banner",
    category: "business",
    icon: "📱",
    desc: "Google Play & App Store download badges with phone mockup showcase.",
  },

  // Content & Proof
  {
    type: "testimonials",
    title: "Customer Reviews & Testimonials",
    category: "content",
    icon: "⭐",
    desc: "5-star rating customer cards with user avatars, reviews & verified tags.",
  },
  {
    type: "faq_section",
    title: "FAQ Accordion Questions",
    category: "content",
    icon: "❓",
    desc: "Interactive collapsible FAQ accordions for shipping, warranty & returns.",
  },
  {
    type: "special_notice",
    title: "Announcement & Flash Notice",
    category: "content",
    icon: "📢",
    desc: "Prominent top alert or coupon notice with CTA button.",
  },
  {
    type: "rich_text",
    title: "Our Story & Brand Philosophy",
    category: "content",
    icon: "📖",
    desc: "About Us story section with high-res photo, bullet points & milestones badge.",
  },
  {
    type: "blog_stories",
    title: "Blog & Lifestyle Stories",
    category: "content",
    icon: "📰",
    desc: "Engaging blog articles and style guides grid.",
  },
];

const PRESETS_LIST: {
  id: BusinessPresetId;
  name: string;
  industry: string;
  icon: string;
  color: string;
  desc: string;
}[] = [
  {
    id: "shopease-vibrant",
    name: "Mega Marketplace",
    industry: "Multi-category General Retail",
    icon: "🛒",
    color: "from-blue-600 to-indigo-600",
    desc: "High-energy marketplace with countdown Flash Deals, Bento collections, 4-col products grid, reviews & App banner.",
  },
  {
    id: "shopease-sidebar-grocery",
    name: "Grocery Supermarket",
    industry: "Fresh Food, Produce & Daily Staples",
    icon: "🥬",
    color: "from-emerald-600 to-teal-600",
    desc: "Left persistent categories tree, 2-Hour fast delivery badges, wholesale bundle banner & farm fresh produce.",
  },
  {
    id: "shopease-dark-luxury",
    name: "Dark Luxury & Couture",
    industry: "High-End Fashion & Designer Goods",
    icon: "✨",
    color: "from-amber-600 to-stone-900",
    desc: "Sleek obsidian dark UI with gold accents, VIP private drop banners, minimalist capsule pills & craftsmanship stories.",
  },
  {
    id: "shopease-fashion",
    name: "Fashion & Apparel Boutique",
    industry: "Trendy Clothing, Footwear & Accessories",
    icon: "👗",
    color: "from-rose-600 to-pink-600",
    desc: "Summer lookbook hero, circular pastel department circles, curated style edits & personal styling advisory.",
  },
  {
    id: "shopease-electronics",
    name: "Electronics & Smart Tech",
    industry: "Smartphones, Laptops, Gadgets & Audio",
    icon: "⚡",
    color: "from-sky-600 to-blue-800",
    desc: "High-tech futuristic theme with official brand warranty badges, spec sheets, brand partner logos & gadget deals.",
  },
  {
    id: "shopease-pharmacy",
    name: "Pharmacy & Healthcare",
    industry: "Medicines, Wellness & Medical Equipment",
    icon: "💊",
    color: "from-teal-600 to-emerald-700",
    desc: "Interactive Prescription File Upload, 24/7 registered pharmacist hotline, tamper-proof delivery badges & dosage FAQ.",
  },
  {
    id: "shopease-restaurant",
    name: "Restaurant & Fast Food",
    industry: "Gourmet Food, Cafe & Food Delivery",
    icon: "🍕",
    color: "from-orange-600 to-amber-600",
    desc: "Interactive Chef's Special Menu with category filter, prep time & direct add-to-cart, hot delivery guarantee.",
  },
  {
    id: "shopease-beauty",
    name: "Beauty & Cosmetics",
    industry: "Skincare, Makeup, Perfume & Care",
    icon: "💄",
    color: "from-pink-600 to-rose-700",
    desc: "Skincare routine browser, free beauty sample badges, cruelty-free philosophy story & verified beauty testimonials.",
  },
];

const COLOR_PALETTES = [
  { name: "Royal Blue", hex: "#2563eb" },
  { name: "Emerald Green", hex: "#059669" },
  { name: "Luxury Amber", hex: "#d97706" },
  { name: "Rose Pink", hex: "#e11d48" },
  { name: "Teal Cyan", hex: "#0d9488" },
  { name: "Flame Orange", hex: "#ea580c" },
  { name: "Deep Violet", hex: "#7c3aed" },
  { name: "Crimson Red", hex: "#dc2626" },
  { name: "Slate Charcoal", hex: "#334155" },
];

export default function SetupPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_VIBRANT_THEME);
  const [activeTab, setActiveTab] = useState<"sections" | "library" | "presets" | "styles">("sections");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>("sec-hero-1");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  // ── Drag and Drop Reordering Handlers ──
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newSections = [...theme.sections];
    const [movedItem] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, movedItem);

    setTheme({ ...theme, sections: newSections });
    setDraggedIndex(null);
    setDragOverIndex(null);
    toast.success("Section reordered!");
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Section Ordering & Actions
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

  const handleDuplicateSection = (sec: SectionItem, idx: number) => {
    const newId = `sec-${sec.type}-${Date.now()}`;
    const duplicated: SectionItem = {
      ...JSON.parse(JSON.stringify(sec)),
      id: newId,
      title: `${sec.title || sec.type} (Copy)`,
    };
    const newSections = [...theme.sections];
    newSections.splice(idx + 1, 0, duplicated);
    setTheme({ ...theme, sections: newSections });
    setSelectedSectionId(newId);
    toast.success("Section duplicated!");
  };

  const handleDeleteSection = (id: string) => {
    const newSections = theme.sections.filter((s) => s.id !== id);
    setTheme({ ...theme, sections: newSections });
    if (selectedSectionId === id) {
      setSelectedSectionId(newSections[0]?.id || null);
    }
    toast.success("Section removed");
  };

  const handleAddSection = (type: SectionType, insertAtIndex?: number) => {
    const newId = `sec-${type}-${Date.now()}`;
    let newSec: SectionItem = {
      id: newId,
      type,
      title: "New " + type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      subtitle: "Customize this section subtitle or description",
      badge: "FEATURED",
      enabled: true,
      settings: {},
    };

    if (type === "hero_slider") {
      newSec.title = "Discover Trending Collections";
      newSec.subtitle = "Exclusive premium arrivals with fast doorstep delivery.";
      newSec.settings = {
        ctaText: "Shop Now",
        ctaLink: "/products",
        sideDealTitle: "Flash Deal",
        sideDealBadge: "Up to 50% OFF",
        sideDealSubtitle: "Limited Time Only",
        heroImage: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&auto=format&fit=crop&q=80",
        bgColor: "from-blue-50 via-indigo-50/50 to-white",
      };
    } else if (type === "flash_sale") {
      newSec.title = "Flash Deals & Limited Drops";
      newSec.subtitle = "Limited time discounts. Grab yours before stocks run out!";
      newSec.settings = { hoursLeft: 8, discountText: "UP TO 60% OFF", limit: 6 };
    } else if (type === "category_showcase") {
      newSec.title = "Explore By Category";
      newSec.settings = { style: "circles", limit: 8 };
    } else if (type === "product_grid") {
      newSec.title = "Top Trending Products";
      newSec.settings = { filter: "all", limit: 8, columns: 4 };
    } else if (type === "restaurant_menu") {
      newSec.title = "Chef's Signature Dishes & Daily Specials";
      newSec.settings = {};
    } else if (type === "pharmacy_upload") {
      newSec.title = "Upload Prescription for Rapid Medicine Delivery";
      newSec.settings = {};
    } else if (type === "testimonials") {
      newSec.title = "What Our Valued Customers Say";
      newSec.settings = {};
    } else if (type === "faq_section") {
      newSec.title = "Frequently Asked Questions";
      newSec.settings = {};
    } else if (type === "special_notice") {
      newSec.title = "⚡ Exclusive Flash Notice: Special Offer Inside!";
      newSec.settings = { themeStyle: "gradient", ctaText: "Check Deals", ctaLink: "/products" };
    } else if (type === "app_download") {
      newSec.title = "Download Our High-Speed Mobile App";
      newSec.settings = {};
    } else if (type === "rich_text") {
      newSec.title = "Our Story & Quality Promise";
      newSec.settings = {
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80",
        ctaText: "Explore More",
        ctaLink: "/products",
      };
    }

    const newSections = [...theme.sections];
    if (typeof insertAtIndex === "number") {
      newSections.splice(insertAtIndex, 0, newSec);
    } else {
      newSections.push(newSec);
    }

    setTheme({ ...theme, sections: newSections });
    setSelectedSectionId(newId);
    setActiveTab("sections");
    toast.success(`Added ${type.replace(/_/g, " ")} section!`);
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

  const handleApplyPreset = (preset: BusinessPresetId) => {
    const loaded = getPresetTheme(preset);
    setTheme(loaded);
    setSelectedSectionId(loaded.sections[0]?.id || null);
    toast.success(`Applied ${preset.replace("shopease-", "").toUpperCase()} template!`);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveActiveTheme(theme);
      toast.success("🎉 Storefront theme & layout published live!");
    } catch (err) {
      toast.error("Failed to save theme");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(theme, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shopease-theme-${theme.themePreset}.json`;
    a.click();
    toast.success("Theme JSON exported successfully!");
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.sections) {
            setTheme(parsed);
            setSelectedSectionId(parsed.sections[0]?.id || null);
            toast.success("Theme imported successfully!");
          }
        } catch (err) {
          toast.error("Invalid JSON file");
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  const selectedSection = theme.sections.find((s) => s.id === selectedSectionId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      
      {/* ── Top Visual Builder Navigation Bar ── */}
      <header className="h-16 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between z-40 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-black text-white hover:text-sky-400 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-500/20">
              <Sliders className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight flex items-center gap-1.5">
                <span>ShopEase Visual Builder</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.2 rounded font-mono">
                  v2.5
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Active Template: <strong className="text-sky-400">{theme.themePreset.replace("shopease-", "")}</strong>
              </span>
            </div>
          </Link>
        </div>

        {/* Responsive Viewport Switcher */}
        <div className="hidden md:flex items-center bg-slate-950 border border-slate-800 rounded-2xl p-1 gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewport === "desktop"
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setViewport("tablet")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewport === "tablet"
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setViewport("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewport === "mobile"
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>

        {/* Action Buttons: Export/Import, View Store & Save */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportJSON}
            title="Export Theme JSON Backup"
            className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <label
            title="Import Theme JSON"
            className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview Store</span>
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/20 transition-transform active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save & Publish"}</span>
          </button>
        </div>
      </header>

      {/* ── Main Workspace: Left Inspector Panel + Center Live Canvas ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ── LEFT PANEL (Tabs + Reorder List + Inspector + Library) ── */}
        <aside className="w-80 sm:w-[410px] bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden shadow-2xl">
          
          {/* Main 4 Tabs */}
          <div className="grid grid-cols-4 border-b border-slate-800 text-[11px] font-bold text-slate-400 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("sections")}
              className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${
                activeTab === "sections"
                  ? "border-sky-500 text-sky-400 bg-slate-800/60 font-black"
                  : "border-transparent hover:text-slate-200"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Layout ({theme.sections.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("library")}
              className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${
                activeTab === "library"
                  ? "border-sky-500 text-sky-400 bg-slate-800/60 font-black"
                  : "border-transparent hover:text-slate-200"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Block</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("presets")}
              className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${
                activeTab === "presets"
                  ? "border-sky-500 text-sky-400 bg-slate-800/60 font-black"
                  : "border-transparent hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Presets</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("styles")}
              className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${
                activeTab === "styles"
                  ? "border-sky-500 text-sky-400 bg-slate-800/60 font-black"
                  : "border-transparent hover:text-slate-200"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Theme</span>
            </button>
          </div>

          {/* Panel Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            
            {/* ════ TAB 1: SECTIONS & DRAG-AND-DROP REORDER ════ */}
            {activeTab === "sections" && (
              <div className="space-y-4">
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Page Sections ({theme.sections.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Drag cards to reorder or click to customize.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("library")}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold hover:bg-sky-500/30 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Drag and Drop List */}
                <div className="space-y-2">
                  {theme.sections.map((sec, idx) => {
                    const isSelected = selectedSectionId === sec.id;
                    const isDragging = draggedIndex === idx;
                    const isOver = dragOverIndex === idx;

                    return (
                      <div
                        key={sec.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedSectionId(sec.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                          isDragging
                            ? "opacity-30 border-dashed border-sky-400 bg-slate-800"
                            : isOver
                            ? "border-sky-400 bg-sky-950/40 ring-2 ring-sky-500/50"
                            : isSelected
                            ? "bg-gradient-to-r from-sky-950/80 to-indigo-950/60 border-sky-500 shadow-md text-white"
                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
                        } ${!sec.enabled ? "opacity-40" : ""}`}
                      >
                        {/* Drag Handle + Number + Title */}
                        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                          <div className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-0.5">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 w-3 shrink-0">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <h4 className="text-xs font-bold truncate">
                              {sec.title || sec.type.replace(/_/g, " ").toUpperCase()}
                            </h4>
                            <span className="text-[10px] text-sky-400/80 uppercase tracking-wider block font-mono truncate">
                              {sec.type}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div
                          className="flex items-center gap-1 shrink-0 ml-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-10"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === theme.sections.length - 1}
                            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-10"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateSection(sec, idx)}
                            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-sky-300"
                            title="Duplicate Section"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleVisible(sec.id)}
                            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
                            title={sec.enabled ? "Hide Section" : "Show Section"}
                          >
                            {sec.enabled ? (
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                            )}
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
                    );
                  })}
                </div>

                {/* Section Inspector Details */}
                {selectedSection && (
                  <div className="pt-4 border-t border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5" />
                        <span>Edit Section: {selectedSection.type}</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">ID: {selectedSection.id}</span>
                    </div>

                    <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Heading Title
                        </label>
                        <input
                          type="text"
                          value={selectedSection.title || ""}
                          onChange={(e) => handleUpdateSelected("title", e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Subtitle / Description
                        </label>
                        <textarea
                          rows={2}
                          value={selectedSection.subtitle || ""}
                          onChange={(e) => handleUpdateSelected("subtitle", e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-sky-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Badge Tag Label
                        </label>
                        <input
                          type="text"
                          value={selectedSection.badge || ""}
                          onChange={(e) => handleUpdateSelected("badge", e.target.value)}
                          placeholder="e.g. FLASH DEAL, NEW ARRIVAL, BESTSELLER"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-sky-500"
                        />
                      </div>

                      {/* Dynamic Section Type Specific Settings */}
                      {selectedSection.type === "hero_slider" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">CTA Button Text</label>
                            <input
                              type="text"
                              value={selectedSection.settings?.ctaText || "Shop Now"}
                              onChange={(e) => handleUpdateSelected("settings.ctaText", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Hero Image URL</label>
                            <input
                              type="text"
                              value={selectedSection.settings?.heroImage || ""}
                              onChange={(e) => handleUpdateSelected("settings.heroImage", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Side Deal Title & Badge</label>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Side Title"
                                value={selectedSection.settings?.sideDealTitle || ""}
                                onChange={(e) => handleUpdateSelected("settings.sideDealTitle", e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                              />
                              <input
                                type="text"
                                placeholder="Discount Badge"
                                value={selectedSection.settings?.sideDealBadge || ""}
                                onChange={(e) => handleUpdateSelected("settings.sideDealBadge", e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedSection.type === "product_grid" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">Grid Columns</label>
                              <select
                                value={selectedSection.settings?.columns || 4}
                                onChange={(e) => handleUpdateSelected("settings.columns", Number(e.target.value))}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                              >
                                <option value={2}>2 Columns</option>
                                <option value={3}>3 Columns</option>
                                <option value={4}>4 Columns</option>
                                <option value={5}>5 Columns</option>
                                <option value={6}>6 Columns</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">Item Limit</label>
                              <input
                                type="number"
                                min={2}
                                max={24}
                                value={selectedSection.settings?.limit || 8}
                                onChange={(e) => handleUpdateSelected("settings.limit", Number(e.target.value))}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                              >
                              </input>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedSection.type === "category_showcase" && (
                        <div className="pt-2 border-t border-slate-800/80">
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Category Layout Style</label>
                          <select
                            value={selectedSection.settings?.style || "circles"}
                            onChange={(e) => handleUpdateSelected("settings.style", e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                          >
                            <option value="circles">Circular Pastel Icons</option>
                            <option value="cards">Bordered Category Cards</option>
                            <option value="pills">Rounded Capsule Pills</option>
                          </select>
                        </div>
                      )}

                      {selectedSection.type === "flash_sale" && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Hours Left</label>
                            <input
                              type="number"
                              value={selectedSection.settings?.hoursLeft || 8}
                              onChange={(e) => handleUpdateSelected("settings.hoursLeft", Number(e.target.value))}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Discount Text</label>
                            <input
                              type="text"
                              value={selectedSection.settings?.discountText || "UP TO 50% OFF"}
                              onChange={(e) => handleUpdateSelected("settings.discountText", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                            />
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════ TAB 2: SECTION LIBRARY (ADD BLOCKS) ════ */}
            {activeTab === "library" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Add New Page Block
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Choose any pre-designed section widget for your business.
                  </p>
                </div>

                <div className="space-y-3">
                  {SECTION_LIBRARY.map((item) => (
                    <div
                      key={item.type}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-sky-500 transition-all flex items-start justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-110 transition-transform">
                          {item.icon}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                              {item.title}
                            </h4>
                            {item.badge && (
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddSection(item.type)}
                        className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shrink-0 shadow-md shadow-sky-600/30 transition-transform active:scale-95"
                        title="Add Section"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════ TAB 3: 1-CLICK BUSINESS PRESETS ════ */}
            {activeTab === "presets" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    1-Click Business Templates
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Transform your store in 1-click tailored for your specific industry.
                  </p>
                </div>

                <div className="space-y-3">
                  {PRESETS_LIST.map((preset) => {
                    const isActive = theme.themePreset === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                          isActive
                            ? "bg-slate-900 border-sky-500 ring-2 ring-sky-500/40 shadow-xl"
                            : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                              {preset.icon}
                            </span>
                            <div>
                              <h4 className="text-xs font-black text-white group-hover:text-sky-400 transition-colors">
                                {preset.name}
                              </h4>
                              <span className="text-[10px] text-slate-400 block font-medium">
                                {preset.industry}
                              </span>
                            </div>
                          </div>
                          {isActive && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {preset.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ════ TAB 4: GLOBAL STYLES & BRANDING ════ */}
            {activeTab === "styles" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Global Branding & Styles
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Customize global colors, dark mode, typography & header style.
                  </p>
                </div>

                {/* Dark Mode Toggle */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                    Color Theme Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTheme({ ...theme, isDarkMode: false })}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        !theme.isDarkMode
                          ? "bg-white text-slate-900 border-sky-500 shadow-md font-black"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      <span>☀️ Light Modern</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme({ ...theme, isDarkMode: true })}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        theme.isDarkMode
                          ? "bg-zinc-950 text-white border-amber-500 shadow-md font-black"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      <span>🌙 Dark Luxury</span>
                    </button>
                  </div>
                </div>

                {/* Brand Primary Color Swatches */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                    Brand Primary Color ({theme.primaryColor})
                  </label>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {COLOR_PALETTES.map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setTheme({ ...theme, primaryColor: color.hex })}
                        className={`h-8 rounded-xl border flex items-center justify-center transition-transform hover:scale-105 ${
                          theme.primaryColor === color.hex
                            ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-105"
                            : "border-slate-700"
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {theme.primaryColor === color.hex && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                    className="w-full h-8 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer p-1"
                  />
                </div>

                {/* Header Layout Style */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                    Store Header Layout
                  </label>
                  <select
                    value={theme.headerStyle}
                    onChange={(e) => setTheme({ ...theme, headerStyle: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="standard">Standard Full-width Header with Categories Bar</option>
                    <option value="sidebar_integrated">Left Categories Sidebar (Grocery / Supermarket)</option>
                    <option value="dark_luxury">Dark Luxury Minimalist Header</option>
                  </select>
                </div>

                {/* Announcement Bar text */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-400">
                      Store Top Announcement Bar
                    </label>
                    <input
                      type="checkbox"
                      checked={theme.showAnnouncement !== false}
                      onChange={(e) => setTheme({ ...theme, showAnnouncement: e.target.checked })}
                      className="rounded accent-sky-500"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={theme.announcementText || ""}
                    onChange={(e) => setTheme({ ...theme, announcementText: e.target.value })}
                    placeholder="e.g. Free Shipping on orders over $50 with code FREESHIP"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white resize-none"
                  />
                </div>

                {/* Typography / Font Family */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                    Typography Font Family
                  </label>
                  <select
                    value={theme.fontFamily}
                    onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="Inter, system-ui, sans-serif">Inter (Modern & Clean)</option>
                    <option value="Outfit, system-ui, sans-serif">Outfit (Luxury & Fashion)</option>
                    <option value="'Plus Jakarta Sans', system-ui, sans-serif">Plus Jakarta Sans (Sleek Tech)</option>
                    <option value="'Playfair Display', serif">Playfair Display (Editorial Elegance)</option>
                  </select>
                </div>

              </div>
            )}

          </div>

        </aside>

        {/* ── RIGHT LIVE INTERACTIVE CANVAS ── */}
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
              minHeight: "850px",
              fontFamily: theme.fontFamily,
            }}
          >
            {/* Storefront Top Announcement */}
            {theme.showAnnouncement !== false && theme.announcementText && (
              <div className="bg-sky-600 text-white text-[11px] font-bold py-1.5 px-4 text-center">
                {theme.announcementText}
              </div>
            )}

            {/* Storefront Header */}
            <Navbar isDarkMode={theme.isDarkMode} />

            {/* Layout Wrapper: Standard vs Sidebar mode */}
            {theme.headerStyle === "sidebar_integrated" ? (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-6">
                <SidebarCategoryNav categories={categories} isDarkMode={theme.isDarkMode} />
                <div className="flex-1 min-w-0 space-y-4">
                  {theme.sections.map((sec, idx) => {
                    if (!sec.enabled) return null;
                    const isSelected = selectedSectionId === sec.id;

                    return (
                      <div
                        key={sec.id}
                        onClick={() => setSelectedSectionId(sec.id)}
                        className={`relative group rounded-3xl transition-all ${
                          isSelected
                            ? "ring-4 ring-sky-500 ring-offset-4 ring-offset-slate-900"
                            : "hover:ring-2 hover:ring-sky-400/50"
                        }`}
                      >
                        {/* Live Canvas Quick Floating Inspector Pill */}
                        <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-xl border border-slate-700 text-xs font-bold">
                          <span className="text-[10px] text-sky-400 uppercase tracking-wider font-mono">
                            {sec.type}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveUp(idx);
                            }}
                            disabled={idx === 0}
                            className="p-1 hover:bg-slate-800 rounded disabled:opacity-20"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveDown(idx);
                            }}
                            disabled={idx === theme.sections.length - 1}
                            className="p-1 hover:bg-slate-800 rounded disabled:opacity-20"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateSection(sec, idx);
                            }}
                            className="p-1 hover:bg-slate-800 rounded text-sky-400"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSection(sec.id);
                            }}
                            className="p-1 hover:bg-rose-950 rounded text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {renderSection(sec, products, categories, theme.isDarkMode)}

                        {/* In-canvas insert button divider */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity py-2 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddSection("product_grid", idx + 1);
                            }}
                            className="px-3 py-1 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-lg shadow-sky-600/30"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Insert Section Here</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {theme.sections.map((sec, idx) => {
                  if (!sec.enabled) return null;
                  const isSelected = selectedSectionId === sec.id;

                  return (
                    <div
                      key={sec.id}
                      onClick={() => setSelectedSectionId(sec.id)}
                      className={`relative group transition-all ${
                        isSelected
                          ? "ring-4 ring-sky-500"
                          : "hover:ring-2 hover:ring-sky-400/50"
                      }`}
                    >
                      {/* Live Canvas Quick Floating Inspector Pill */}
                      <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-xl border border-slate-700 text-xs font-bold">
                        <span className="text-[10px] text-sky-400 uppercase tracking-wider font-mono">
                          {sec.type}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveUp(idx);
                          }}
                          disabled={idx === 0}
                          className="p-1 hover:bg-slate-800 rounded disabled:opacity-20"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveDown(idx);
                          }}
                          disabled={idx === theme.sections.length - 1}
                          className="p-1 hover:bg-slate-800 rounded disabled:opacity-20"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateSection(sec, idx);
                          }}
                          className="p-1 hover:bg-slate-800 rounded text-sky-400"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSection(sec.id);
                          }}
                          className="p-1 hover:bg-rose-950 rounded text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {renderSection(sec, products, categories, theme.isDarkMode)}

                      {/* In-canvas insert button divider */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity py-2 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddSection("product_grid", idx + 1);
                          }}
                          className="px-3 py-1 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-lg shadow-sky-600/30"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Insert Section Here</span>
                        </button>
                      </div>
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
