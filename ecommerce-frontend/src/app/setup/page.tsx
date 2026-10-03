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
  Grid,
  List,
  Image as ImageIcon,
  Megaphone,
  X,
  Edit3,
  ArrowLeft,
  ChevronLeft,
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
import { useTheme } from "@/context/ThemeContext";
import toast from "react-hot-toast";

// Section Components for Live Preview
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
    desc: "Highlight cards for Free Shipping, Warranty, Returns & 24/7 Support with custom icons.",
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
    desc: "Grid or List layout with 2-6 columns, category filter & limit.",
    badge: "GRID / LIST",
  },
  {
    type: "promotions_section",
    title: "Promotions & POS Vouchers",
    category: "products",
    icon: "🏷️",
    desc: "Synced POS coupons, copyable discount codes & promotional campaign cards.",
    badge: "POS SYNC",
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
    title: "Bento Grid Collections",
    category: "products",
    icon: "🍱",
    desc: "High-impact visual Bento tiles linking to featured departments.",
  },
  {
    type: "promo_split_banner",
    title: "Split Promo Hero Banner",
    category: "products",
    icon: "🎁",
    desc: "Dual-card promotional hero with lifestyle graphics & CTA links.",
  },
  {
    type: "curated_recommendations",
    title: "Curated Recommendations",
    category: "products",
    icon: "✨",
    desc: "AI / Staff handpicked products with highlight cards & ratings.",
  },

  // Business Specific
  {
    type: "pharmacy_upload",
    title: "Prescription Upload & Rx",
    category: "business",
    icon: "💊",
    desc: "Customer prescription upload box for Pharmacy & Health stores.",
    badge: "PHARMACY",
  },
  {
    type: "restaurant_menu",
    title: "Restaurant Menu Browser",
    category: "business",
    icon: "🍕",
    desc: "Categorized food menu cards with prep time & quick order.",
    badge: "RESTAURANT",
  },
  {
    type: "app_download",
    title: "Mobile App Download Banner",
    category: "business",
    icon: "📱",
    desc: "Promote iOS & Android mobile shopping applications with QR code.",
  },

  // Content
  {
    type: "special_notice",
    title: "Announcement & Notice Bar",
    category: "content",
    icon: "📢",
    desc: "Urgent top banner with customizable gradients and action buttons.",
  },
  {
    type: "brands_carousel",
    title: "Brand Partners Carousel",
    category: "content",
    icon: "🏢",
    desc: "Official brand partner logos and manufacturer carousel.",
  },
  {
    type: "testimonials",
    title: "Customer Reviews & Social Proof",
    category: "content",
    icon: "⭐",
    desc: "5-star customer testimonials with avatars and verified badges.",
  },
  {
    type: "faq_section",
    title: "FAQ Accordion Questions",
    category: "content",
    icon: "❓",
    desc: "Collapsible frequently asked questions for policies & delivery.",
  },
  {
    type: "blog_stories",
    title: "Blog & Style Stories",
    category: "content",
    icon: "📰",
    desc: "Editorial articles, tips and buying guides for shoppers.",
  },
  {
    type: "rich_text",
    title: "Custom Brand Story / About",
    category: "content",
    icon: "📝",
    desc: "Custom text, brand heritage headline, image and CTA button.",
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
  { name: "Indigo Sapphire", hex: "#4f46e5" },
];

export default function SetupPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme();

  const [theme, setTheme] = useState<ThemeConfig>(globalTheme || DEFAULT_VIBRANT_THEME);
  const [activeTab, setActiveTab] = useState<"sections" | "library" | "presets" | "styles">("sections");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>("sec-hero-1");
  const [isEditingSingleSection, setIsEditingSingleSection] = useState(false);
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

  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [loadedTheme, prods, cats, conf] = await Promise.all([
          fetchActiveTheme(),
          StorefrontAPI.getProducts({ limit: 16 }),
          StorefrontAPI.getCategories(),
          StorefrontAPI.getConfig(),
        ]);
        setTheme(loadedTheme);
        setGlobalTheme(loadedTheme);
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

  // Update theme and sync with ThemeContext
  const updateLocalAndGlobalTheme = (newTheme: ThemeConfig) => {
    setTheme(newTheme);
    setGlobalTheme(newTheme);
  };

  const handleSelectSection = (id: string, openEditor = true) => {
    setSelectedSectionId(id);
    setActiveTab("sections");
    if (openEditor) {
      setIsEditingSingleSection(true);
    }
    if (sidebarScrollRef.current) {
      sidebarScrollRef.current.scrollTop = 0;
    }
    setTimeout(() => {
      const el = document.getElementById(`preview-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 60);
  };

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

    updateLocalAndGlobalTheme({ ...theme, sections: newSections });
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
    updateLocalAndGlobalTheme({ ...theme, sections: newSections });
  };

  const handleMoveDown = (index: number) => {
    if (index === theme.sections.length - 1) return;
    const newSections = [...theme.sections];
    const temp = newSections[index + 1];
    newSections[index + 1] = newSections[index];
    newSections[index] = temp;
    updateLocalAndGlobalTheme({ ...theme, sections: newSections });
  };

  const handleToggleVisible = (id: string) => {
    const newSections = theme.sections.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    updateLocalAndGlobalTheme({ ...theme, sections: newSections });
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
    updateLocalAndGlobalTheme({ ...theme, sections: newSections });
    setSelectedSectionId(newId);
    setIsEditingSingleSection(true);
    toast.success("Section duplicated!");
  };

  const handleDeleteSection = (id: string) => {
    if (theme.sections.length <= 1) {
      toast.error("You must keep at least 1 section on the page.");
      return;
    }
    const newSections = theme.sections.filter((s) => s.id !== id);
    updateLocalAndGlobalTheme({ ...theme, sections: newSections });
    if (selectedSectionId === id) {
      setSelectedSectionId(newSections[0]?.id || null);
      setIsEditingSingleSection(false);
    }
    toast.success("Section deleted");
  };

  const handleAddSection = (type: SectionType, insertAtIndex?: number) => {
    const newId = `sec-${type}-${Date.now()}`;
    const newSec: SectionItem = {
      id: newId,
      type,
      enabled: true,
      settings: {},
    };

    if (type === "hero_slider") {
      newSec.title = "Explore New Premium Trends & Deals";
      newSec.subtitle = "Exclusive quality, express shipping and 100% genuine products.";
      newSec.badge = "NEW COLLECTION";
      newSec.settings = {
        ctaText: "Shop Now",
        ctaLink: "/products",
        heroImage: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&auto=format&fit=crop&q=80",
        sideDealTitle: "Weekend Deal",
        sideDealBadge: "Up to 50% OFF",
        sideDealSubtitle: "Limited quantities",
        sideDealHours: 12,
        sideDealImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
      };
    } else if (type === "product_grid") {
      newSec.title = "Trending Products";
      newSec.subtitle = "Top rated items selected by our staff";
      newSec.badge = "HOT PICKS";
      newSec.settings = { layout: "grid", columns: 4, limit: 8, showRating: true, showBadge: true, showStock: true };
    } else if (type === "promotions_section") {
      newSec.title = "Special Offers & Coupon Discounts";
      newSec.subtitle = "Copy discount voucher codes and apply at checkout for instant savings!";
      newSec.badge = "PROMOTIONS & VOUCHERS";
      newSec.settings = {
        customVouchers: [
          { code: "SAVE20", title: "Weekend Discount", discount: "20% OFF", desc: "Get 20% off on your entire shopping cart.", expires: "Valid 3 Days" },
          { code: "FREESHIP", title: "Free Express Shipping", discount: "FREE SHIP", desc: "Free shipping for orders over $30 / ৳300.", expires: "Limited Offer" },
        ],
      };
    } else if (type === "category_showcase") {
      newSec.title = "Shop by Category";
      newSec.subtitle = "Browse all collections & top brands";
      newSec.settings = { style: "circles", limit: 8 };
    } else if (type === "flash_sale") {
      newSec.title = "Flash Sale Deals";
      newSec.subtitle = "Hurry up! Special discounts for a limited time only.";
      newSec.badge = "FLASH DEAL";
      newSec.settings = { hoursLeft: 8, discountText: "UP TO 60% OFF", limit: 6 };
    } else if (type === "featured_collections") {
      newSec.title = "Featured Collections";
      newSec.subtitle = "Curated departments for your daily lifestyle";
      newSec.settings = {
        layout: "bento_3",
        cards: [
          {
            title: "Summer Collection",
            subtitle: "Light & breathable styles",
            cta: "Shop Now",
            link: "/products?category=Fashion",
            image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600&auto=format&fit=crop&q=80",
          },
          {
            title: "Smart Devices",
            subtitle: "Next-gen tech",
            cta: "Explore",
            link: "/products?category=Electronics",
            image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80",
          },
          {
            title: "Daily Fresh Essentials",
            subtitle: "Pantry & Groceries",
            cta: "Order Fresh",
            link: "/products?category=Grocery",
            image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
          },
        ],
      };
    } else if (type === "promo_split_banner") {
      newSec.title = "Upgrade Your Lifestyle With Premium Picks";
      newSec.subtitle = "Top quality, verified sellers, unbeatable warranty guaranteed.";
      newSec.badge = "SUPER SALE";
      newSec.settings = {
        ctaText: "Shop Collection",
        ctaLink: "/products",
        sideCardTitle: "Quality & Trust",
        sideCardSubtitle: "100% Genuine Certified Goods",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
      };
    } else if (type === "feature_badges") {
      newSec.settings = {
        items: [
          { icon: "Truck", title: "Free Shipping", desc: "On orders over $50 / ৳500" },
          { icon: "ShieldCheck", title: "Secure Payment", desc: "100% secure checkout" },
          { icon: "RotateCcw", title: "Easy Returns", desc: "7 days instant return policy" },
          { icon: "Headphones", title: "24/7 Support", desc: "Dedicated friendly customer support" },
        ],
      };
    } else if (type === "brands_carousel") {
      newSec.title = "Official Brand Partners";
      newSec.subtitle = "Authorized dealer for leading global & local manufacturers";
      newSec.settings = {
        brands: [
          { name: "Apple", logo: "" },
          { name: "Samsung", logo: "SAMSUNG" },
          { name: "Nike", logo: "NIKE" },
          { name: "Adidas", logo: "adidas" },
          { name: "Sony", logo: "SONY" },
          { name: "P&G", logo: "P&G" },
        ],
      };
    } else if (type === "testimonials") {
      newSec.title = "What Our Customers Say";
      newSec.subtitle = "Real feedback from verified shoppers";
      newSec.badge = "REVIEWS";
      newSec.settings = {
        reviews: [
          { name: "Tanzim Ahmed", role: "Verified Buyer", comment: "Super fast delivery and authentic products! Customer service resolved my query in minutes.", rating: 5 },
          { name: "Sabrina Rahman", role: "Loyal Customer", comment: "Best online shopping experience by far! Huge variety and easy checkout.", rating: 5 },
          { name: "Farhan Hossain", role: "Business Owner", comment: "Extremely reliable quality and great discounts on bulk orders. Highly recommended!", rating: 5 },
        ],
      };
    } else if (type === "faq_section") {
      newSec.title = "Frequently Asked Questions";
      newSec.subtitle = "Got questions? We have got answers.";
      newSec.badge = "HELP CENTER";
      newSec.settings = {
        faqs: [
          { q: "How fast is delivery?", a: "Standard delivery inside city takes 24-48 hours. Express is 2-4 hours." },
          { q: "What payment methods are supported?", a: "Cash on Delivery, bKash, Nagad, Cards and Bank Transfer." },
          { q: "Can I return items?", a: "Yes, we offer a hassle-free 7-day return policy." },
        ],
      };
    } else if (type === "blog_stories") {
      newSec.title = "Latest Stories & Style Tips";
      newSec.subtitle = "Editorial buying guides and insights from our team";
      newSec.settings = {
        articles: [
          { title: "10 Best Tech Gadgets You Should Buy in 2026", desc: "Comprehensive review of highest rated gadgets.", date: "Aug 12, 2026", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80" },
          { title: "How to Build a Capsule Wardrobe on a Budget", desc: "Timeless fashion hacks and essential outfits.", date: "Aug 10, 2026", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80" },
        ],
      };
    } else if (type === "special_notice") {
      newSec.title = "⚡ Exclusive Promo: 20% Instant Cashback on All Online Payments!";
      newSec.subtitle = "Use code CASH20 at checkout. Limited time only.";
      newSec.badge = "LIMITED OFFER";
      newSec.settings = { themeStyle: "gradient", ctaText: "Claim Offer", ctaLink: "/products" };
    } else if (type === "curated_recommendations") {
      newSec.title = "Curated Recommendations";
      newSec.subtitle = "Handpicked collections tailored to your lifestyle";
      newSec.badge = "RECOMMENDED";
      newSec.settings = { limit: 6 };
    } else if (type === "app_download") {
      newSec.title = "Shop Faster & Smarter with our Mobile App";
      newSec.subtitle = "Get exclusive in-app vouchers and real-time delivery tracking.";
      newSec.badge = "MOBILE APP";
      newSec.settings = {
        playStoreUrl: "#",
        appStoreUrl: "#",
        mockupImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&auto=format&fit=crop&q=80",
      };
    } else if (type === "pharmacy_upload") {
      newSec.title = "Quick Prescription Upload & Medicine Delivery";
      newSec.subtitle = "Upload your doctor prescription and get verified delivery within 2 hours.";
      newSec.badge = "ONLINE PHARMACY";
      newSec.settings = { hotline: "+880 1700-000000", deliveryEta: "2-Hour Express" };
    } else if (type === "restaurant_menu") {
      newSec.title = "Chef's Handcrafted Specialties & Popular Platters";
      newSec.subtitle = "Prepared fresh upon order with authentic gourmet ingredients.";
      newSec.badge = "GOURMET KITCHEN";
      newSec.settings = {};
    } else if (type === "newsletter") {
      newSec.title = "Subscribe to Our VIP Club Newsletter";
      newSec.subtitle = "Get exclusive discount codes, flash sale alerts and seasonal promotions.";
      newSec.settings = { buttonText: "Subscribe Now" };
    } else if (type === "rich_text") {
      newSec.title = "Our Story & Quality Promise";
      newSec.subtitle = "Crafting exceptional shopping experiences since day one.";
      newSec.settings = {
        bodyText: "We are committed to delivering authentic products directly to your doorstep with express speed and unbeatable customer care.",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80",
        ctaText: "Learn More",
        ctaLink: "/products",
      };
    }

    const newSections = [...theme.sections];
    if (typeof insertAtIndex === "number") {
      newSections.splice(insertAtIndex, 0, newSec);
    } else {
      newSections.push(newSec);
    }

    updateLocalAndGlobalTheme({ ...theme, sections: newSections });
    setSelectedSectionId(newId);
    setIsEditingSingleSection(true);
    setActiveTab("sections");
    toast.success(`Added ${type.replace(/_/g, " ")} section!`);
    setTimeout(() => {
      const el = document.getElementById(`preview-${newId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleUpdateSelected = (field: string, val: any) => {
    if (!selectedSectionId) return;
    const newSections = theme.sections.map((s) => {
      if (s.id !== selectedSectionId) return s;
      if (field.startsWith("settings.")) {
        const key = field.replace("settings.", "");
        return {
          ...s,
          settings: { ...(s.settings || {}), [key]: val },
        };
      }
      return { ...s, [field]: val };
    });
    updateLocalAndGlobalTheme({ ...theme, sections: newSections });
  };

  const handleApplyPreset = (preset: BusinessPresetId) => {
    const loaded = getPresetTheme(preset);
    updateLocalAndGlobalTheme(loaded);
    setSelectedSectionId(loaded.sections[0]?.id || null);
    setIsEditingSingleSection(false);
    toast.success(`Applied ${preset.replace("shopease-", "").toUpperCase()} template!`);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveActiveTheme(theme);
      setGlobalTheme(theme);
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
            updateLocalAndGlobalTheme(parsed);
            setSelectedSectionId(parsed.sections[0]?.id || null);
            setIsEditingSingleSection(false);
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
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
              style={{ backgroundColor: theme.primaryColor || "#2563eb" }}
            >
              <Sliders className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight flex items-center gap-1.5">
                <span>ShopEase Visual Builder</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.2 rounded font-mono">
                  v3.0 PRO
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Preset: <strong style={{ color: theme.primaryColor || "#2563eb" }}>{theme.themePreset.replace("shopease-", "")}</strong>
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
                ? "bg-slate-800 text-white shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
            style={viewport === "desktop" ? { backgroundColor: theme.primaryColor || "#2563eb" } : {}}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setViewport("tablet")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewport === "tablet"
                ? "bg-slate-800 text-white shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
            style={viewport === "tablet" ? { backgroundColor: theme.primaryColor || "#2563eb" } : {}}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setViewport("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewport === "mobile"
                ? "bg-slate-800 text-white shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
            style={viewport === "mobile" ? { backgroundColor: theme.primaryColor || "#2563eb" } : {}}
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
            <span className="hidden sm:inline">Preview Live Store</span>
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            style={{
              backgroundColor: theme.primaryColor || "#2563eb",
              boxShadow: `0 8px 20px ${theme.primaryColor || "#2563eb"}40`,
            }}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save & Publish"}</span>
          </button>
        </div>
      </header>

      {/* ── Main Workspace: Left Inspector Panel + Center Live Canvas ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ── LEFT PANEL (Tabs + Reorder List + Detailed Inspector + Library + Styles) ── */}
        <aside className="w-80 sm:w-[440px] bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden shadow-2xl">
          
          {/* Main 4 Tabs */}
          <div className="grid grid-cols-4 border-b border-slate-800 text-[11px] font-bold text-slate-400 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab("sections");
                setIsEditingSingleSection(false);
              }}
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
              onClick={() => {
                setActiveTab("library");
                setIsEditingSingleSection(false);
              }}
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
              onClick={() => {
                setActiveTab("presets");
                setIsEditingSingleSection(false);
              }}
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
              onClick={() => {
                setActiveTab("styles");
                setIsEditingSingleSection(false);
              }}
              className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-all ${
                activeTab === "styles"
                  ? "border-sky-500 text-sky-400 bg-slate-800/60 font-black"
                  : "border-transparent hover:text-slate-200"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Theme & Header</span>
            </button>
          </div>

          {/* Panel Scrollable Body */}
          <div ref={sidebarScrollRef} className="flex-1 overflow-y-auto p-4 space-y-5">
            
            {/* ════ TAB 1: SECTIONS LIST OR SINGLE SECTION DEDICATED EDITOR ════ */}
            {activeTab === "sections" && (
              <div className="space-y-4">
                
                {isEditingSingleSection && selectedSection ? (
                  /* ── DEDICATED FULL SCREEN SECTION EDITOR ── */
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsEditingSingleSection(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>All Sections</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleVisible(selectedSection.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title={selectedSection.enabled ? "Hide" : "Show"}
                        >
                          {selectedSection.enabled ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(selectedSection.id)}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400"
                          title="Delete Section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{selectedSection.type.replace(/_/g, " ")}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{selectedSection.id}</span>
                      </div>

                      {/* Common Heading Title */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Heading Title
                        </label>
                        <input
                          type="text"
                          value={selectedSection.title || ""}
                          onChange={(e) => handleUpdateSelected("title", e.target.value)}
                          placeholder="Section Title"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-sky-500"
                        />
                      </div>

                      {/* Common Subtitle */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Subtitle / Description
                        </label>
                        <textarea
                          rows={2}
                          value={selectedSection.subtitle || ""}
                          onChange={(e) => handleUpdateSelected("subtitle", e.target.value)}
                          placeholder="Supporting subtitle text..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-sky-500 resize-none"
                        />
                      </div>

                      {/* Common Badge Tag */}
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

                      {/* ── 1. PRODUCT GRID SETTINGS ── */}
                      {selectedSection.type === "product_grid" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                              Display Layout Mode
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateSelected("settings.layout", "grid")}
                                className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                  (selectedSection.settings?.layout || "grid") === "grid"
                                    ? "bg-sky-600 text-white border-sky-500 shadow-md font-black"
                                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                                }`}
                              >
                                <Grid className="w-3.5 h-3.5" />
                                <span>Grid View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateSelected("settings.layout", "list")}
                                className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                  selectedSection.settings?.layout === "list"
                                    ? "bg-sky-600 text-white border-sky-500 shadow-md font-black"
                                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                                }`}
                              >
                                <List className="w-3.5 h-3.5" />
                                <span>List View</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">Columns</label>
                              <select
                                value={selectedSection.settings?.columns || 4}
                                onChange={(e) => handleUpdateSelected("settings.columns", Number(e.target.value))}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                              >
                                <option value={2}>2 Columns</option>
                                <option value={3}>3 Columns</option>
                                <option value={4}>4 Columns (Default)</option>
                                <option value={5}>5 Columns</option>
                                <option value={6}>6 Columns</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">Max Items</label>
                              <input
                                type="number"
                                min={2}
                                max={24}
                                value={selectedSection.settings?.limit || 8}
                                onChange={(e) => handleUpdateSelected("settings.limit", Number(e.target.value))}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Category Filter</label>
                            <select
                              value={selectedSection.settings?.categoryId || ""}
                              onChange={(e) => handleUpdateSelected("settings.categoryId", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                            >
                              <option value="">All Categories (Auto)</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <label className="flex items-center gap-2 text-[11px] text-slate-300 font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSection.settings?.showRating !== false}
                                onChange={(e) => handleUpdateSelected("settings.showRating", e.target.checked)}
                                className="rounded bg-slate-900 border-slate-800 text-sky-600"
                              />
                              <span>Show Star Ratings</span>
                            </label>
                            <label className="flex items-center gap-2 text-[11px] text-slate-300 font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSection.settings?.showStock !== false}
                                onChange={(e) => handleUpdateSelected("settings.showStock", e.target.checked)}
                                className="rounded bg-slate-900 border-slate-800 text-sky-600"
                              />
                              <span>Show In-Stock Badges</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* ── 2. HERO SLIDER SETTINGS ── */}
                      {selectedSection.type === "hero_slider" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div className="grid grid-cols-2 gap-2">
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
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">CTA Link URL</label>
                              <input
                                type="text"
                                value={selectedSection.settings?.ctaLink || "/products"}
                                onChange={(e) => handleUpdateSelected("settings.ctaLink", e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Hero Banner Image URL</label>
                            <input
                              type="text"
                              value={selectedSection.settings?.heroImage || ""}
                              onChange={(e) => handleUpdateSelected("settings.heroImage", e.target.value)}
                              placeholder="https://..."
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                            />
                          </div>

                          <div className="pt-2 border-t border-slate-800/60 space-y-2">
                            <span className="text-[10px] font-black uppercase text-amber-400 block">
                              Side Deal Card
                            </span>
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
                                placeholder="Discount Badge (e.g. 50% OFF)"
                                value={selectedSection.settings?.sideDealBadge || ""}
                                onChange={(e) => handleUpdateSelected("settings.sideDealBadge", e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="Side Deal Image URL"
                              value={selectedSection.settings?.sideDealImage || ""}
                              onChange={(e) => handleUpdateSelected("settings.sideDealImage", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* ── 3. FEATURE BADGES REPEATER ── */}
                      {selectedSection.type === "feature_badges" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-400">Trust Badges Items</label>
                            <button
                              type="button"
                              onClick={() => {
                                const current = selectedSection.settings?.items || [];
                                handleUpdateSelected("settings.items", [
                                  ...current,
                                  { icon: "Truck", title: "New Badge", desc: "Short description" },
                                ]);
                              }}
                              className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-bold hover:bg-sky-500/30 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Badge</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(selectedSection.settings?.items || [
                              { icon: "Truck", title: "Free Shipping", desc: "On orders over $50 / ৳500" },
                              { icon: "ShieldCheck", title: "Secure Payment", desc: "100% secure checkout" },
                              { icon: "RotateCcw", title: "Easy Returns", desc: "7 days instant return policy" },
                              { icon: "Headphones", title: "24/7 Support", desc: "Dedicated friendly customer support" },
                            ]).map((it: any, i: number) => (
                              <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <select
                                    value={it.icon || "Truck"}
                                    onChange={(e) => {
                                      const items = [...(selectedSection.settings?.items || [])];
                                      items[i] = { ...items[i], icon: e.target.value };
                                      handleUpdateSelected("settings.items", items);
                                    }}
                                    className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-white"
                                  >
                                    <option value="Truck">Truck (Shipping)</option>
                                    <option value="ShieldCheck">Shield (Security)</option>
                                    <option value="RotateCcw">RotateCcw (Returns)</option>
                                    <option value="Headphones">Headphones (Support)</option>
                                    <option value="CreditCard">CreditCard (Payment)</option>
                                    <option value="Sparkles">Sparkles (Quality)</option>
                                  </select>

                                  <input
                                    type="text"
                                    placeholder="Badge Title"
                                    value={it.title || ""}
                                    onChange={(e) => {
                                      const items = [...(selectedSection.settings?.items || [])];
                                      items[i] = { ...items[i], title: e.target.value };
                                      handleUpdateSelected("settings.items", items);
                                    }}
                                    className="flex-1 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-white"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const items = (selectedSection.settings?.items || []).filter((_: any, idx: number) => idx !== i);
                                      handleUpdateSelected("settings.items", items);
                                    }}
                                    className="p-1 text-rose-400 hover:bg-rose-950 rounded"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Short Description"
                                  value={it.desc || ""}
                                  onChange={(e) => {
                                    const items = [...(selectedSection.settings?.items || [])];
                                    items[i] = { ...items[i], desc: e.target.value };
                                    handleUpdateSelected("settings.items", items);
                                  }}
                                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── 4. FEATURED COLLECTIONS (BENTO CARDS REPEATER) ── */}
                      {selectedSection.type === "featured_collections" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-400">Bento Cards</label>
                            <button
                              type="button"
                              onClick={() => {
                                const current = selectedSection.settings?.cards || [];
                                handleUpdateSelected("settings.cards", [
                                  ...current,
                                  {
                                    title: "New Collection",
                                    subtitle: "Trending Picks",
                                    cta: "Shop Now",
                                    link: "/products",
                                    image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600&auto=format&fit=crop&q=80",
                                  },
                                ]);
                              }}
                              className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-bold hover:bg-sky-500/30 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Card</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(selectedSection.settings?.cards || []).map((card: any, i: number) => (
                              <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    type="text"
                                    placeholder="Card Title"
                                    value={card.title || ""}
                                    onChange={(e) => {
                                      const cards = [...(selectedSection.settings?.cards || [])];
                                      cards[i] = { ...cards[i], title: e.target.value };
                                      handleUpdateSelected("settings.cards", cards);
                                    }}
                                    className="flex-1 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cards = (selectedSection.settings?.cards || []).filter((_: any, idx: number) => idx !== i);
                                      handleUpdateSelected("settings.cards", cards);
                                    }}
                                    className="p-1 text-rose-400 hover:bg-rose-950 rounded"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Subtitle"
                                    value={card.subtitle || ""}
                                    onChange={(e) => {
                                      const cards = [...(selectedSection.settings?.cards || [])];
                                      cards[i] = { ...cards[i], subtitle: e.target.value };
                                      handleUpdateSelected("settings.cards", cards);
                                    }}
                                    className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-white"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Link (/products?cat=...)"
                                    value={card.link || ""}
                                    onChange={(e) => {
                                      const cards = [...(selectedSection.settings?.cards || [])];
                                      cards[i] = { ...cards[i], link: e.target.value };
                                      handleUpdateSelected("settings.cards", cards);
                                    }}
                                    className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-white"
                                  />
                                </div>

                                <input
                                  type="text"
                                  placeholder="Image URL"
                                  value={card.image || ""}
                                  onChange={(e) => {
                                    const cards = [...(selectedSection.settings?.cards || [])];
                                    cards[i] = { ...cards[i], image: e.target.value };
                                    handleUpdateSelected("settings.cards", cards);
                                  }}
                                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-white font-mono"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── 5. PROMOTIONS & VOUCHERS REPEATER ── */}
                      {selectedSection.type === "promotions_section" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                            <Tag className="w-4 h-4 shrink-0" />
                            <span>This block automatically pulls active promotions & coupons from your POS Admin! You can also define custom voucher cards below.</span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <label className="text-[11px] font-bold text-slate-400">Custom Promo Cards</label>
                            <button
                              type="button"
                              onClick={() => {
                                const current = selectedSection.settings?.customVouchers || [];
                                handleUpdateSelected("settings.customVouchers", [
                                  ...current,
                                  {
                                    code: "SAVE10",
                                    title: "Special Voucher",
                                    discount: "10% OFF",
                                    desc: "10% discount on entire cart.",
                                    expires: "Valid for 7 days",
                                    badge: "PROMO",
                                  },
                                ]);
                              }}
                              className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-bold hover:bg-sky-500/30 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Coupon Card</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(selectedSection.settings?.customVouchers || []).map((v: any, i: number) => (
                              <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    type="text"
                                    placeholder="Coupon Code (e.g. SHOP20)"
                                    value={v.code || ""}
                                    onChange={(e) => {
                                      const vouchers = [...(selectedSection.settings?.customVouchers || [])];
                                      vouchers[i] = { ...vouchers[i], code: e.target.value.toUpperCase() };
                                      handleUpdateSelected("settings.customVouchers", vouchers);
                                    }}
                                    className="flex-1 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white uppercase"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Discount (20% OFF)"
                                    value={v.discount || ""}
                                    onChange={(e) => {
                                      const vouchers = [...(selectedSection.settings?.customVouchers || [])];
                                      vouchers[i] = { ...vouchers[i], discount: e.target.value };
                                      handleUpdateSelected("settings.customVouchers", vouchers);
                                    }}
                                    className="w-28 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-amber-400 font-bold"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const vouchers = (selectedSection.settings?.customVouchers || []).filter((_: any, idx: number) => idx !== i);
                                      handleUpdateSelected("settings.customVouchers", vouchers);
                                    }}
                                    className="p-1 text-rose-400 hover:bg-rose-950 rounded"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <input
                                  type="text"
                                  placeholder="Title & Description"
                                  value={v.desc || ""}
                                  onChange={(e) => {
                                    const vouchers = [...(selectedSection.settings?.customVouchers || [])];
                                    vouchers[i] = { ...vouchers[i], desc: e.target.value };
                                    handleUpdateSelected("settings.customVouchers", vouchers);
                                  }}
                                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── 6. TESTIMONIALS REPEATER ── */}
                      {selectedSection.type === "testimonials" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-400">Customer Testimonials</label>
                            <button
                              type="button"
                              onClick={() => {
                                const current = selectedSection.settings?.reviews || [];
                                handleUpdateSelected("settings.reviews", [
                                  ...current,
                                  {
                                    name: "Customer Name",
                                    role: "Verified Buyer",
                                    comment: "Super fast delivery and great quality!",
                                    rating: 5,
                                    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                                  },
                                ]);
                              }}
                              className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-bold hover:bg-sky-500/30 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Review</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(selectedSection.settings?.reviews || [
                              { name: "Tanzim Ahmed", role: "Verified Buyer", comment: "Super fast delivery and authentic products!", rating: 5 },
                              { name: "Sabrina Rahman", role: "Loyal Customer", comment: "Best online shopping experience by far!", rating: 5 },
                            ]).map((rev: any, i: number) => (
                              <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    type="text"
                                    placeholder="Customer Name"
                                    value={rev.name || ""}
                                    onChange={(e) => {
                                      const reviews = [...(selectedSection.settings?.reviews || [])];
                                      reviews[i] = { ...reviews[i], name: e.target.value };
                                      handleUpdateSelected("settings.reviews", reviews);
                                    }}
                                    className="flex-1 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-white"
                                  />
                                  <select
                                    value={rev.rating || 5}
                                    onChange={(e) => {
                                      const reviews = [...(selectedSection.settings?.reviews || [])];
                                      reviews[i] = { ...reviews[i], rating: Number(e.target.value) };
                                      handleUpdateSelected("settings.reviews", reviews);
                                    }}
                                    className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-amber-400 font-bold"
                                  >
                                    <option value={5}>5 Stars ★★★★★</option>
                                    <option value={4}>4 Stars ★★★★☆</option>
                                    <option value={3}>3 Stars ★★★☆☆</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const reviews = (selectedSection.settings?.reviews || []).filter((_: any, idx: number) => idx !== i);
                                      handleUpdateSelected("settings.reviews", reviews);
                                    }}
                                    className="p-1 text-rose-400 hover:bg-rose-950 rounded"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <textarea
                                  rows={2}
                                  placeholder="Customer Review Comment..."
                                  value={rev.comment || ""}
                                  onChange={(e) => {
                                    const reviews = [...(selectedSection.settings?.reviews || [])];
                                    reviews[i] = { ...reviews[i], comment: e.target.value };
                                    handleUpdateSelected("settings.reviews", reviews);
                                  }}
                                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 resize-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── 7. FAQ QUESTIONS REPEATER ── */}
                      {selectedSection.type === "faq_section" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-400">FAQ Question Items</label>
                            <button
                              type="button"
                              onClick={() => {
                                const current = selectedSection.settings?.faqs || [];
                                handleUpdateSelected("settings.faqs", [
                                  ...current,
                                  { q: "New Question?", a: "Detailed answer goes here." },
                                ]);
                              }}
                              className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-bold hover:bg-sky-500/30 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add FAQ</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(selectedSection.settings?.faqs || [
                              { q: "How fast is delivery?", a: "Standard delivery inside city takes 24-48 hours. Express is 2-4 hours." },
                              { q: "What payment methods are supported?", a: "Cash on Delivery, bKash, Nagad, Cards and Bank Transfer." },
                            ]).map((faq: any, i: number) => (
                              <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    type="text"
                                    placeholder="Question"
                                    value={faq.q || ""}
                                    onChange={(e) => {
                                      const faqs = [...(selectedSection.settings?.faqs || [])];
                                      faqs[i] = { ...faqs[i], q: e.target.value };
                                      handleUpdateSelected("settings.faqs", faqs);
                                    }}
                                    className="flex-1 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-bold text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const faqs = (selectedSection.settings?.faqs || []).filter((_: any, idx: number) => idx !== i);
                                      handleUpdateSelected("settings.faqs", faqs);
                                    }}
                                    className="p-1 text-rose-400 hover:bg-rose-950 rounded"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <textarea
                                  rows={2}
                                  placeholder="Answer..."
                                  value={faq.a || ""}
                                  onChange={(e) => {
                                    const faqs = [...(selectedSection.settings?.faqs || [])];
                                    faqs[i] = { ...faqs[i], a: e.target.value };
                                    handleUpdateSelected("settings.faqs", faqs);
                                  }}
                                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 resize-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── 8. BRANDS CAROUSEL REPEATER ── */}
                      {selectedSection.type === "brands_carousel" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-400">Partner Brands</label>
                            <button
                              type="button"
                              onClick={() => {
                                const current = selectedSection.settings?.brands || [];
                                handleUpdateSelected("settings.brands", [
                                  ...current,
                                  { name: "Brand Name", logo: "BRAND" },
                                ]);
                              }}
                              className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-bold hover:bg-sky-500/30 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Brand</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {(selectedSection.settings?.brands || [
                              { name: "Apple", logo: "" },
                              { name: "Samsung", logo: "SAMSUNG" },
                              { name: "Nike", logo: "NIKE" },
                              { name: "Adidas", logo: "adidas" },
                            ]).map((b: any, i: number) => (
                              <div key={i} className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-1.5">
                                <input
                                  type="text"
                                  value={b.name || ""}
                                  onChange={(e) => {
                                    const brands = [...(selectedSection.settings?.brands || [])];
                                    brands[i] = { ...brands[i], name: e.target.value, logo: e.target.value };
                                    handleUpdateSelected("settings.brands", brands);
                                  }}
                                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const brands = (selectedSection.settings?.brands || []).filter((_: any, idx: number) => idx !== i);
                                    handleUpdateSelected("settings.brands", brands);
                                  }}
                                  className="p-1 text-rose-400 hover:bg-rose-950 rounded"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── 9. BLOG STORIES REPEATER ── */}
                      {selectedSection.type === "blog_stories" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-400">Blog Articles</label>
                            <button
                              type="button"
                              onClick={() => {
                                const current = selectedSection.settings?.articles || [];
                                handleUpdateSelected("settings.articles", [
                                  ...current,
                                  {
                                    title: "New Blog Article",
                                    desc: "Article summary excerpt...",
                                    date: "Today",
                                    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
                                  },
                                ]);
                              }}
                              className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-bold hover:bg-sky-500/30 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Article</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(selectedSection.settings?.articles || []).map((art: any, i: number) => (
                              <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    type="text"
                                    placeholder="Article Title"
                                    value={art.title || ""}
                                    onChange={(e) => {
                                      const articles = [...(selectedSection.settings?.articles || [])];
                                      articles[i] = { ...articles[i], title: e.target.value };
                                      handleUpdateSelected("settings.articles", articles);
                                    }}
                                    className="flex-1 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const articles = (selectedSection.settings?.articles || []).filter((_: any, idx: number) => idx !== i);
                                      handleUpdateSelected("settings.articles", articles);
                                    }}
                                    className="p-1 text-rose-400 hover:bg-rose-950 rounded"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Short Excerpt Description"
                                  value={art.desc || ""}
                                  onChange={(e) => {
                                    const articles = [...(selectedSection.settings?.articles || [])];
                                    articles[i] = { ...articles[i], desc: e.target.value };
                                    handleUpdateSelected("settings.articles", articles);
                                  }}
                                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                                />
                                <input
                                  type="text"
                                  placeholder="Image URL"
                                  value={art.image || ""}
                                  onChange={(e) => {
                                    const articles = [...(selectedSection.settings?.articles || [])];
                                    articles[i] = { ...articles[i], image: e.target.value };
                                    handleUpdateSelected("settings.articles", articles);
                                  }}
                                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-white font-mono"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── 10. CATEGORY SHOWCASE ── */}
                      {selectedSection.type === "category_showcase" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div>
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
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Display Limit</label>
                            <input
                              type="number"
                              min={4}
                              max={16}
                              value={selectedSection.settings?.limit || 8}
                              onChange={(e) => handleUpdateSelected("settings.limit", Number(e.target.value))}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* ── 11. FLASH SALE ── */}
                      {selectedSection.type === "flash_sale" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">Hours Left (Timer)</label>
                              <input
                                type="number"
                                value={selectedSection.settings?.hoursLeft || 8}
                                onChange={(e) => handleUpdateSelected("settings.hoursLeft", Number(e.target.value))}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">Discount Tag Text</label>
                              <input
                                type="text"
                                value={selectedSection.settings?.discountText || "UP TO 50% OFF"}
                                onChange={(e) => handleUpdateSelected("settings.discountText", e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── 12. PROMO SPLIT BANNER ── */}
                      {selectedSection.type === "promo_split_banner" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div className="grid grid-cols-2 gap-2">
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
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">CTA Link</label>
                              <input
                                type="text"
                                value={selectedSection.settings?.ctaLink || "/products"}
                                onChange={(e) => handleUpdateSelected("settings.ctaLink", e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Background Image URL</label>
                            <input
                              type="text"
                              value={selectedSection.settings?.image || ""}
                              onChange={(e) => handleUpdateSelected("settings.image", e.target.value)}
                              placeholder="https://..."
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* ── 13. SPECIAL NOTICE ── */}
                      {selectedSection.type === "special_notice" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">Notice Style</label>
                              <select
                                value={selectedSection.settings?.themeStyle || "gradient"}
                                onChange={(e) => handleUpdateSelected("settings.themeStyle", e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                              >
                                <option value="gradient">Vibrant Gradient</option>
                                <option value="solid">Dark Solid</option>
                                <option value="alert">Amber Alert</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">CTA Button Text</label>
                              <input
                                type="text"
                                value={selectedSection.settings?.ctaText || "Claim Offer"}
                                onChange={(e) => handleUpdateSelected("settings.ctaText", e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── 14. RICH TEXT / ABOUT ── */}
                      {selectedSection.type === "rich_text" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Brand Story Content</label>
                            <textarea
                              rows={3}
                              value={selectedSection.settings?.bodyText || ""}
                              onChange={(e) => handleUpdateSelected("settings.bodyText", e.target.value)}
                              placeholder="Write your brand mission and quality promise..."
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Image URL</label>
                            <input
                              type="text"
                              value={selectedSection.settings?.image || ""}
                              onChange={(e) => handleUpdateSelected("settings.image", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* ── 15. NEWSLETTER ── */}
                      {selectedSection.type === "newsletter" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Button CTA Text</label>
                            <input
                              type="text"
                              value={selectedSection.settings?.buttonText || "Subscribe"}
                              onChange={(e) => handleUpdateSelected("settings.buttonText", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* ── 16. CURATED RECOMMENDATIONS ── */}
                      {selectedSection.type === "curated_recommendations" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Max Items</label>
                            <input
                              type="number"
                              min={3}
                              max={18}
                              value={selectedSection.settings?.limit || 6}
                              onChange={(e) => handleUpdateSelected("settings.limit", Number(e.target.value))}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* ── 17. APP DOWNLOAD ── */}
                      {selectedSection.type === "app_download" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Google Play Store URL</label>
                            <input
                              type="text"
                              value={selectedSection.settings?.playStoreUrl || ""}
                              onChange={(e) => handleUpdateSelected("settings.playStoreUrl", e.target.value)}
                              placeholder="https://play.google.com/..."
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Apple App Store URL</label>
                            <input
                              type="text"
                              value={selectedSection.settings?.appStoreUrl || ""}
                              onChange={(e) => handleUpdateSelected("settings.appStoreUrl", e.target.value)}
                              placeholder="https://apps.apple.com/..."
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Mobile Mockup Image URL</label>
                            <input
                              type="text"
                              value={selectedSection.settings?.mockupImage || ""}
                              onChange={(e) => handleUpdateSelected("settings.mockupImage", e.target.value)}
                              placeholder="https://..."
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* ── 18. PHARMACY UPLOAD ── */}
                      {selectedSection.type === "pharmacy_upload" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Pharmacist Hotline</label>
                            <input
                              type="text"
                              value={selectedSection.settings?.hotline || "+880 1700-000000"}
                              onChange={(e) => handleUpdateSelected("settings.hotline", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Delivery Time ETA</label>
                            <input
                              type="text"
                              value={selectedSection.settings?.deliveryEta || "2-Hour Express"}
                              onChange={(e) => handleUpdateSelected("settings.deliveryEta", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* ── 19. RESTAURANT MENU ── */}
                      {selectedSection.type === "restaurant_menu" && (
                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                            <span>🍕 Automatically renders your live Food & Beverage products categorized with prep time and direct order buttons.</span>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                ) : (
                  /* ── MAIN SECTIONS LIST VIEW ── */
                  <>
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
                        <span>Add Block</span>
                      </button>
                    </div>

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
                            onClick={() => handleSelectSection(sec.id, true)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                              isDragging
                                ? "opacity-30 border-dashed border-sky-500"
                                : isOver
                                ? "border-sky-400 bg-sky-950/40 translate-x-1"
                                : isSelected
                                ? "bg-slate-800/90 border-sky-500 ring-2 ring-sky-500/40 shadow-lg"
                                : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                            } ${!sec.enabled ? "opacity-50" : ""}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-300 p-0.5"
                                title="Drag to reorder"
                              >
                                <GripVertical className="w-4 h-4" />
                              </span>

                              <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-400">
                                {idx + 1}
                              </div>

                              <div className="min-w-0">
                                <span className="block text-xs font-bold text-white truncate">
                                  {sec.title || sec.type.replace(/_/g, " ")}
                                </span>
                                <span className="block text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                                  {sec.type}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div
                              className="flex items-center gap-1 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleSelectSection(sec.id, true)}
                                className="p-1 rounded-md bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-[10px] font-bold px-2 py-0.5"
                                title="Edit Details"
                              >
                                Edit ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveUp(idx)}
                                disabled={idx === 0}
                                className="p-1 rounded-md hover:bg-slate-700 text-slate-400 disabled:opacity-20"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveDown(idx)}
                                disabled={idx === theme.sections.length - 1}
                                className="p-1 rounded-md hover:bg-slate-700 text-slate-400 disabled:opacity-20"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateSection(sec, idx)}
                                className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-sky-400"
                                title="Duplicate"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleVisible(sec.id)}
                                className="p-1 rounded-md hover:bg-slate-700 text-slate-400"
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
                  </>
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
                    Click any widget below to insert and customize it immediately.
                  </p>
                </div>

                <div className="space-y-3">
                  {SECTION_LIBRARY.map((item) => (
                    <div
                      key={item.type}
                      onClick={() => handleAddSection(item.type)}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-sky-500 hover:bg-slate-900/80 cursor-pointer transition-all flex items-start justify-between gap-3 group active:scale-[0.99]"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-110 group-hover:border-sky-500/50 transition-all shrink-0">
                          {item.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                              {item.title}
                            </h4>
                            {item.badge && (
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddSection(item.type);
                        }}
                        className="px-2.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shrink-0 shadow-md shadow-sky-600/30 transition-transform active:scale-95 flex items-center gap-1 text-xs font-bold"
                        title="Add Section"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-[10px] hidden sm:inline">Add</span>
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

            {/* ════ TAB 4: GLOBAL STYLES, HEADER BRANDING & COLORS ════ */}
            {activeTab === "styles" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Global Branding & Header Customizer
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Customize header logo, colors, top banner, announcement bar & dark mode.
                  </p>
                </div>

                {/* 1. Header Logo & Brand Settings */}
                <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                  <h4 className="text-xs font-black uppercase text-sky-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Header Logo & Brand Identity</span>
                  </h4>

                  {/* Logo Image URL */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Header Logo Image URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={theme.headerLogo || ""}
                      onChange={(e) => updateLocalAndGlobalTheme({ ...theme, headerLogo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                    />
                    {theme.headerLogo && (
                      <div className="mt-2 p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                        <img
                          src={theme.headerLogo}
                          alt="Logo Preview"
                          className="h-8 max-w-[120px] object-contain bg-white/10 p-1 rounded"
                        />
                        <span className="text-[10px] text-emerald-400 font-semibold">Active Logo Preview</span>
                      </div>
                    )}
                  </div>

                  {/* Brand Name Text */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Brand Name</label>
                      <input
                        type="text"
                        value={theme.headerLogoText || ""}
                        onChange={(e) => updateLocalAndGlobalTheme({ ...theme, headerLogoText: e.target.value })}
                        placeholder="ShopEase"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Tagline</label>
                      <input
                        type="text"
                        value={theme.headerLogoTagline || ""}
                        onChange={(e) => updateLocalAndGlobalTheme({ ...theme, headerLogoTagline: e.target.value })}
                        placeholder="Everything You Need"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Header Layout Style */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Header Layout Style</label>
                    <select
                      value={theme.headerStyle || "standard"}
                      onChange={(e) => updateLocalAndGlobalTheme({ ...theme, headerStyle: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    >
                      <option value="standard">Standard Full-Width Header</option>
                      <option value="sidebar_integrated">Sidebar Integrated Category Navigation</option>
                      <option value="dark_luxury">Dark Luxury Obsidian Glass</option>
                      <option value="minimal">Minimal Clean Header</option>
                    </select>
                  </div>

                  {/* Top Decorative Header Banner Image */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Top Decorative Banner Image URL (Optional)</label>
                    <input
                      type="text"
                      value={theme.headerBannerImage || ""}
                      onChange={(e) => updateLocalAndGlobalTheme({ ...theme, headerBannerImage: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* 2. Announcement Bar Customizer */}
                <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>Announcement Bar</span>
                    </h4>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={theme.showAnnouncement !== false}
                        onChange={(e) => updateLocalAndGlobalTheme({ ...theme, showAnnouncement: e.target.checked })}
                        className="rounded bg-slate-900 border-slate-800 text-sky-600"
                      />
                      <span>Enable</span>
                    </label>
                  </div>

                  {theme.showAnnouncement !== false && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Announcement Message</label>
                        <input
                          type="text"
                          value={theme.announcementText || ""}
                          onChange={(e) => updateLocalAndGlobalTheme({ ...theme, announcementText: e.target.value })}
                          placeholder="🎉 Free Shipping on orders over $50 with code FREESHIP"
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Bar Background Color</label>
                          <input
                            type="color"
                            value={theme.announcementBgColor || theme.primaryColor || "#2563eb"}
                            onChange={(e) => updateLocalAndGlobalTheme({ ...theme, announcementBgColor: e.target.value })}
                            className="w-full h-8 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer p-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Text Color</label>
                          <input
                            type="color"
                            value={theme.announcementTextColor || "#ffffff"}
                            onChange={(e) => updateLocalAndGlobalTheme({ ...theme, announcementTextColor: e.target.value })}
                            className="w-full h-8 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer p-1"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* 3. Dark Mode Toggle */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                    Color Theme Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateLocalAndGlobalTheme({ ...theme, isDarkMode: false })}
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
                      onClick={() => updateLocalAndGlobalTheme({ ...theme, isDarkMode: true })}
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

                {/* 4. Brand Primary Color Swatches */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-400">
                      Brand Primary Theme Color
                    </label>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-sky-400">
                      {theme.primaryColor || "#2563eb"}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {COLOR_PALETTES.map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => updateLocalAndGlobalTheme({ ...theme, primaryColor: color.hex })}
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
                    value={theme.primaryColor || "#2563eb"}
                    onChange={(e) => updateLocalAndGlobalTheme({ ...theme, primaryColor: e.target.value })}
                    className="w-full h-8 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer p-1"
                  />
                </div>

              </div>
            )}

          </div>
        </aside>

        {/* ── CENTER / RIGHT LIVE CANVAS PREVIEW ── */}
        <main className="flex-1 bg-slate-950/90 overflow-y-auto p-4 sm:p-6 flex flex-col items-center">
          
          <div
            className={`transition-all duration-300 w-full rounded-3xl overflow-hidden shadow-2xl border ${
              viewport === "mobile"
                ? "max-w-[400px] my-4 border-slate-700 ring-8 ring-slate-800"
                : viewport === "tablet"
                ? "max-w-[768px] my-4 border-slate-700 ring-8 ring-slate-800"
                : "max-w-7xl border-slate-800"
            } ${theme.isDarkMode ? "bg-zinc-950 text-white" : "bg-white text-slate-900"}`}
          >
            {/* Live Navbar Preview */}
            <Navbar isDarkMode={theme.isDarkMode} />

            {/* Sections Canvas */}
            {theme.headerStyle === "sidebar_integrated" ? (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex gap-6">
                <SidebarCategoryNav categories={categories} isDarkMode={theme.isDarkMode} />
                <div className="flex-1 min-w-0 space-y-4">
                  {theme.sections.map((sec, idx) => {
                    if (!sec.enabled) return null;
                    const isSelected = selectedSectionId === sec.id;

                    return (
                      <div
                        key={sec.id}
                        id={`preview-${sec.id}`}
                        onClickCapture={(e) => {
                          if ((e.target as HTMLElement).closest('.builder-canvas-action')) {
                            return;
                          }
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectSection(sec.id, true);
                        }}
                        className={`relative group rounded-3xl transition-all cursor-pointer ${
                          isSelected
                            ? "ring-4 ring-sky-500 ring-offset-4 ring-offset-slate-950 shadow-2xl"
                            : "hover:ring-2 hover:ring-sky-400/60"
                        }`}
                      >
                        {/* Live Canvas Floating Inspector Toolbar */}
                        <div className="absolute top-3 right-3 z-30 opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-2xl border border-slate-700 text-xs font-bold">
                          <span className="text-[10px] text-sky-400 uppercase tracking-wider font-mono mr-1">
                            {sec.type.replace(/_/g, " ")}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectSection(sec.id, true);
                            }}
                            className="builder-canvas-action px-2 py-0.5 bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 rounded font-bold text-[11px]"
                            title="Edit Section Details"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveUp(idx);
                            }}
                            disabled={idx === 0}
                            className="builder-canvas-action p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-20"
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
                            className="builder-canvas-action p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-20"
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
                            className="builder-canvas-action p-1 hover:bg-slate-800 rounded text-sky-400"
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
                            className="builder-canvas-action p-1 hover:bg-rose-950 rounded text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {renderSection(sec, products, categories, theme.isDarkMode)}
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
                      id={`preview-${sec.id}`}
                      onClickCapture={(e) => {
                        if ((e.target as HTMLElement).closest('.builder-canvas-action')) {
                          return;
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectSection(sec.id, true);
                      }}
                      className={`relative group transition-all cursor-pointer ${
                        isSelected
                          ? "ring-4 ring-sky-500 ring-offset-4 ring-offset-slate-950 shadow-2xl"
                          : "hover:ring-2 hover:ring-sky-400/60"
                      }`}
                    >
                      {/* Live Canvas Floating Inspector Toolbar */}
                      <div className="absolute top-4 right-4 z-30 opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-2xl border border-slate-700 text-xs font-bold">
                        <span className="text-[10px] text-sky-400 uppercase tracking-wider font-mono mr-1">
                          {sec.type.replace(/_/g, " ")}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSection(sec.id, true);
                          }}
                          className="builder-canvas-action px-2 py-0.5 bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 rounded font-bold text-[11px]"
                          title="Edit Section Details"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveUp(idx);
                          }}
                          disabled={idx === 0}
                          className="builder-canvas-action p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-20"
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
                          className="builder-canvas-action p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-20"
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
                          className="builder-canvas-action p-1 hover:bg-slate-800 rounded text-sky-400"
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
                          className="builder-canvas-action p-1 hover:bg-rose-950 rounded text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

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
