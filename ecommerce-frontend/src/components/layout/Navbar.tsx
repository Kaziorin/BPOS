"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Truck,
  User,
  Menu,
  X,
  Phone,
  Store,
  Layers,
  ChevronDown,
  Heart,
  Bell,
  MapPin,
  Sliders,
  LogOut,
  ShieldCheck,
  Sparkles,
  Tag,
  ArrowRight,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { useTheme } from "@/context/ThemeContext";
import { StorefrontAPI, CategoryItem } from "@/lib/api";
import LoginModal from "@/components/auth/LoginModal";

interface NavbarProps {
  isDarkMode?: boolean;
}

export default function Navbar({ isDarkMode }: NavbarProps) {
  const router = useRouter();
  const { cartCount, setIsDrawerOpen } = useCart();
  const { customer, adminUser, isAdmin, logout } = useAuth();
  const { storeName, businessType } = useStoreConfig();
  const { theme, primaryColor, accentColor } = useTheme();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("All Categories");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    StorefrontAPI.getCategories()
      .then((cats) => setCategories(Array.isArray(cats) ? cats : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await StorefrontAPI.getProducts({
          search: searchQuery.trim(),
          categoryId: selectedCat !== "All Categories" ? selectedCat : undefined,
          limit: 6,
        });
        setSearchResults(res.items || []);
        setShowSearchDropdown(true);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCat]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isDark = isDarkMode !== undefined ? isDarkMode : theme.isDarkMode;
  const brandTitle = theme.headerLogoText || storeName || "ShopEase";
  const brandTagline = theme.headerLogoTagline || "Everything You Need";

  return (
    <>
      {/* ── Top Announcement Bar ── */}
      {theme.showAnnouncement !== false && theme.announcementText && (
        <div className="text-xs font-medium py-2 px-4 text-center transition-colors flex items-center justify-center gap-2 bg-[#1C1917] text-stone-200 border-b border-stone-800">
          <span>{theme.announcementText.replace(/[🎉💄🥬✨🚀👗💊🍕]\s*/g, "")}</span>
          {theme.announcementLink && (
            <Link
              href={theme.announcementLink}
              className="underline hover:text-white inline-flex items-center gap-1 font-semibold ml-1 text-xs text-orange-400"
            >
              <span>Shop deals</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* ── Optional Top Decorative Header Banner Image ── */}
      {theme.headerBannerImage && (
        <div className="w-full h-12 sm:h-16 overflow-hidden relative">
          <img
            src={theme.headerBannerImage}
            alt="Header Announcement Banner"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <header
        className={`sticky top-0 z-40 w-full transition-colors border-b ${
          isDark
            ? "bg-zinc-950 border-zinc-800 text-white"
            : "bg-[#FFF7ED] border-orange-200/80 text-stone-900"
        }`}
      >
        {/* Main Navbar Bar */}
        <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12">
          <div className="flex items-center justify-between h-16 sm:h-[72px] gap-3 sm:gap-6">
            
            {/* Logo: Custom Image Logo or SalePay Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              {theme.headerLogo ? (
                <img
                  src={theme.headerLogo}
                  alt={brandTitle}
                  className="h-9 sm:h-11 w-auto object-contain max-w-[180px]"
                />
              ) : (
                <img
                  src={isDark ? "/logos/salepay-logo-white.png" : "/logos/salepay-logo-blue.png"}
                  alt="SalePay"
                  className="h-9 sm:h-10 w-auto object-contain max-w-[150px]"
                />
              )}
            </Link>

            {/* Search Bar with Category Selector & Autocomplete Dropdown */}
            <div className="hidden md:flex flex-1 max-w-xl relative">
              <form
                onSubmit={handleSearchSubmit}
                className={`w-full flex items-center rounded-lg border px-3.5 py-2 transition-colors ${
                  isDark
                    ? "bg-zinc-900 border-zinc-700 focus-within:border-orange-500"
                    : "bg-white border-orange-200 focus-within:border-orange-600 shadow-2xs"
                }`}
              >
                <Search className={`w-4 h-4 shrink-0 mr-2.5 ${isDark ? "text-zinc-400" : "text-slate-400"}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                  placeholder="Search products"
                  className={`w-full bg-transparent text-xs sm:text-sm focus:outline-none ${
                    isDark ? "placeholder-zinc-500 text-white" : "placeholder-slate-400 text-slate-900"
                  }`}
                />

                {/* Category selector inside Search */}
                <div className={`relative border-l pl-3 ml-2 shrink-0 ${isDark ? "border-zinc-700" : "border-slate-200"}`}>
                  <select
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(e.target.value)}
                    className={`bg-transparent text-xs font-medium focus:outline-none cursor-pointer ${
                      isDark ? "text-zinc-300" : "text-slate-700"
                    }`}
                  >
                    <option value="All Categories" className={isDark ? "bg-zinc-900 text-white" : "bg-white text-slate-900"}>All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className={isDark ? "bg-zinc-900 text-white" : "bg-white text-slate-900"}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </form>

              {/* Autocomplete Results Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSearchDropdown(false)}
                  />
                  <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-xl overflow-hidden z-50 divide-y ${
                    isDark ? "bg-zinc-900 border-zinc-700 divide-zinc-800" : "bg-white border-stone-200 divide-stone-100"
                  }`}>
                    <div className={`p-3 flex items-center justify-between text-[11px] font-semibold ${
                      isDark ? "bg-zinc-800/60 text-zinc-400" : "bg-stone-50 text-stone-500"
                    }`}>
                      <span>Live Results ({searchResults.length})</span>
                      <button
                        type="button"
                        onClick={() => setShowSearchDropdown(false)}
                        className="text-stone-400 hover:text-stone-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-1.5 space-y-0.5 max-h-72 overflow-y-auto">
                      {searchResults.map((item) => (
                        <Link
                          key={item.id}
                          href={`/products/${item.id}`}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setSearchQuery("");
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg transition-colors group ${
                            isDark ? "hover:bg-zinc-800" : "hover:bg-stone-50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-md border overflow-hidden shrink-0 flex items-center justify-center ${
                              isDark ? "bg-zinc-800 border-zinc-700" : "bg-stone-100 border-stone-200"
                            }`}>
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <ShoppingBag className="w-4 h-4 text-stone-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-stone-900 group-hover:text-[#0F5132]"}`}>
                                {item.name}
                              </h4>
                              <span className="text-[10px] text-stone-400 font-normal">
                                {item.categoryName || "Product"}
                              </span>
                            </div>
                          </div>

                          <span className={`text-xs font-bold shrink-0 ml-2 tabular-nums font-mono ${isDark ? "text-white" : "text-stone-900"}`}>
                            ৳{Number(item.sellingPrice || item.price || 0).toLocaleString()}
                          </span>
                        </Link>
                      ))}
                    </div>

                    <div className={`p-2.5 text-center border-t ${isDark ? "bg-zinc-800/40 border-zinc-800" : "bg-stone-50 border-stone-100"}`}>
                      <Link
                        href={`/products?search=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={() => setShowSearchDropdown(false)}
                        className="text-xs font-semibold text-[#0F5132] hover:underline inline-flex items-center gap-1"
                      >
                        <span>View all matching products</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              
              {/* Promo Deals Link */}
              <Link
                href="/products?filter=deals"
                className={`hidden xl:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
                  isDark
                    ? "bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                    : "bg-white border-orange-200 text-stone-700 hover:bg-orange-50"
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-orange-600" />
                <span>Deals</span>
              </Link>

              {/* Wishlist */}
              <Link
                href="/products"
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-stone-600 hover:bg-orange-100/70"
                }`}
                title="Saved items"
              >
                <Heart className="w-4 h-4" />
              </Link>

              {/* User Account / Login Button */}
              <div className="relative">
                {customer || adminUser ? (
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      isDark ? "hover:bg-zinc-800" : "hover:bg-orange-100/70"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-md bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                      {(adminUser?.name || customer?.name || "U")[0].toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left leading-tight pr-0.5">
                      <span className={`block text-xs font-semibold truncate max-w-[90px] ${isDark ? "text-white" : "text-stone-900"}`}>
                        {adminUser?.name || customer?.name}
                      </span>
                      <span className={`block text-[10px] font-normal ${isDark ? "text-zinc-400" : "text-stone-500"}`}>
                        {isAdmin ? "Store Owner" : "Account"}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      isDark
                        ? "border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
                        : "border-orange-200 bg-white text-stone-800 hover:bg-orange-50"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                )}

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-lg py-1.5 z-50 ${
                    isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-stone-200"
                  }`}>
                    <div className={`px-4 py-2 border-b ${isDark ? "border-zinc-800" : "border-stone-100"}`}>
                      <p className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-stone-900"}`}>
                        {adminUser?.name || customer?.name}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate">
                        {adminUser?.email || customer?.phone || customer?.email}
                      </p>
                    </div>

                    {isAdmin && (
                      <Link
                        href="/setup"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-50 transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Page Builder &amp; Setup</span>
                      </Link>
                    )}

                    <Link
                      href="/track-order"
                      onClick={() => setIsUserMenuOpen(false)}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${
                        isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Orders</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mini Cart Button */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer bg-orange-600 hover:bg-orange-700 text-white"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                <span className="min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold text-[10px] tabular-nums font-mono bg-white/20 text-white">
                  {cartCount}
                </span>
              </button>

            </div>

          </div>
        </div>

        {/* Categories Navigation Bar */}
        <div className={`border-t hidden sm:block ${
          isDark ? "border-zinc-800 bg-zinc-900 text-zinc-200" : "border-stone-800 bg-[#1C1917] text-stone-200"
        }`}>
          <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 flex items-center justify-between py-2 text-xs font-medium">
            
            {/* All Categories Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-stone-700 bg-stone-800 text-white text-xs font-semibold hover:bg-stone-700 transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-orange-400" />
                <span>All Categories</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {/* Categories Mega Dropdown */}
              {isCategoryOpen && (
                <div className={`absolute left-0 mt-2 w-64 rounded-xl border shadow-lg p-1.5 z-50 ${
                  isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-stone-200"
                }`}>
                  {categories.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-stone-400">No categories yet</div>
                  ) : (
                    categories.map((c) => (
                      <Link
                        key={c.id}
                        href={`/products?categoryId=${c.id}`}
                        onClick={() => setIsCategoryOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isDark ? "text-zinc-200 hover:bg-zinc-800" : "text-stone-700 hover:bg-orange-50 hover:text-orange-700"
                        }`}
                      >
                        <span>{c.name}</span>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-6 text-stone-200">
              <Link href="/products?filter=deals" className="font-semibold text-orange-400 hover:underline">
                Deals &amp; Offers
              </Link>
              <Link href="/products" className="hover:text-white transition-colors">
                All Products
              </Link>
              <Link href="/products?sort=newest" className="hover:text-white transition-colors">
                New Arrivals
              </Link>
              <Link href="/products?sort=popular" className="hover:text-white transition-colors">
                Popular
              </Link>
            </div>

            <div className="flex items-center gap-4 text-slate-300">
              <Link href="/track-order" className="hover:text-white transition-colors font-medium">
                Track Order
              </Link>
            </div>

          </div>
        </div>

      </header>

      {/* Auth Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}
