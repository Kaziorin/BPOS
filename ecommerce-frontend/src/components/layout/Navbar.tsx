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
      {/* ── Optional Top Header Announcement Bar ── */}
      {theme.showAnnouncement !== false && theme.announcementText && (
        <div
          className="text-xs font-bold py-2 px-4 text-center transition-colors flex items-center justify-center gap-2"
          style={{
            backgroundColor: theme.announcementBgColor || primaryColor || "#2563eb",
            color: theme.announcementTextColor || "#ffffff",
          }}
        >
          <span>{theme.announcementText}</span>
          {theme.announcementLink && (
            <Link
              href={theme.announcementLink}
              className="underline hover:opacity-80 inline-flex items-center gap-1 font-black ml-1 text-[11px]"
            >
              <span>Shop Deals</span>
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
        className={`sticky top-0 z-40 w-full transition-colors border-b backdrop-blur-md shadow-xs ${
          isDark
            ? "bg-zinc-950/95 border-zinc-800 text-white"
            : "bg-white/95 border-slate-200/90 text-slate-800"
        }`}
      >
        {/* Main Navbar Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-3 sm:gap-6">
            
            {/* Logo: Image Logo or Text Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              {theme.headerLogo ? (
                <img
                  src={theme.headerLogo}
                  alt={brandTitle}
                  className="h-10 sm:h-12 w-auto object-contain max-w-[180px]"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-md group-hover:scale-105 transition-transform"
                  style={{
                    backgroundColor: primaryColor,
                    boxShadow: `0 8px 16px ${primaryColor}40`,
                  }}
                >
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
              )}
              
              {!theme.headerLogo && (
                <div>
                  <span
                    className="text-xl font-black tracking-tight block"
                    style={{ color: primaryColor }}
                  >
                    {brandTitle}
                  </span>
                  <span className="block text-[9px] font-bold text-slate-400 tracking-wider uppercase">
                    {brandTagline}
                  </span>
                </div>
              )}
            </Link>

            {/* Search Bar with Category Selector & Autocomplete Dropdown */}
            <div className="hidden md:flex flex-1 max-w-2xl relative">
              <form
                onSubmit={handleSearchSubmit}
                className={`w-full flex items-center rounded-full border px-4 py-2 transition-all ${
                  isDark
                    ? "bg-zinc-900 border-zinc-700/80 focus-within:border-sky-500"
                    : "bg-slate-50 border-slate-200 focus-within:bg-white shadow-xs"
                }`}
              >
                <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                  placeholder="Search for products, brands, coupons and more..."
                  className="w-full bg-transparent text-xs sm:text-sm focus:outline-none placeholder-slate-400 text-slate-900 dark:text-white"
                />

                {/* Category selector inside Search */}
                <div className="relative border-l border-slate-200 dark:border-zinc-700 pl-3 ml-2 shrink-0">
                  <select
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-600 dark:text-zinc-300 focus:outline-none cursor-pointer"
                  >
                    <option value="All Categories" className="dark:bg-zinc-900">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="dark:bg-zinc-900">
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
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800 animate-in fade-in zoom-in-95">
                    <div className="p-3 bg-slate-950/80 flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>Live Results ({searchResults.length})</span>
                      <button
                        type="button"
                        onClick={() => setShowSearchDropdown(false)}
                        className="text-slate-500 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
                      {searchResults.map((item) => (
                        <Link
                          key={item.id}
                          href={`/products/${item.id}`}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-800 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <ShoppingBag className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-1">
                                {item.name}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {item.categoryName || "Product"}
                              </span>
                            </div>
                          </div>

                          <span
                            className="text-xs font-black shrink-0 ml-2"
                            style={{ color: primaryColor }}
                          >
                            ৳{Number(item.sellingPrice || item.price || 0).toLocaleString()}
                          </span>
                        </Link>
                      ))}
                    </div>

                    <div className="p-2.5 bg-slate-950/90 text-center">
                      <Link
                        href={`/products?search=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={() => setShowSearchDropdown(false)}
                        className="text-xs font-bold text-sky-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>View all matching products</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Action Icons (Location, Wishlist, Notification, Account, Cart) */}
            <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
              
              {/* Promo Deals Badge Link */}
              <Link
                href="/products?filter=deals"
                className="hidden xl:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-transform hover:scale-105"
                style={{
                  borderColor: `${primaryColor}40`,
                  backgroundColor: `${primaryColor}10`,
                  color: primaryColor,
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hot Deals</span>
              </Link>

              {/* Wishlist */}
              <Link
                href="/products"
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Wishlist"
              >
                <Heart className="w-4 h-4" />
              </Link>

              {/* Notifications */}
              <button
                type="button"
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              </button>

              {/* User Account / Login Button */}
              <div className="relative">
                {customer || adminUser ? (
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {(adminUser?.name || customer?.name || "U")[0].toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left leading-tight pr-1">
                      <span className="block text-xs font-bold truncate max-w-[90px]">
                        {adminUser?.name || customer?.name}
                      </span>
                      <span className="block text-[9px] text-slate-400 font-semibold uppercase">
                        {isAdmin ? "Admin / Owner" : "Customer"}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 transition-all shadow-xs"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                )}

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {adminUser?.name || customer?.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {adminUser?.email || customer?.phone || customer?.email}
                      </p>
                    </div>

                    {isAdmin && (
                      <Link
                        href="/setup"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-sky-600 hover:bg-sky-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Page Builder & Setup</span>
                      </Link>
                    )}

                    <Link
                      href="/track-order"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
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
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
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
                className="relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-white font-black text-xs shadow-md transition-transform active:scale-95"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow: `0 8px 20px ${primaryColor}40`,
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                <span
                  className="w-5 h-5 rounded-full bg-white flex items-center justify-center font-black text-[10px]"
                  style={{ color: primaryColor }}
                >
                  {cartCount}
                </span>
              </button>

            </div>

          </div>
        </div>

        {/* Categories Navigation Bar */}
        <div className="border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/60 hidden sm:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-2 text-xs font-semibold">
            
            {/* All Categories Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-white font-bold shadow-xs hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Categories</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Categories Mega Dropdown */}
              {isCategoryOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-2 z-50 animate-fadeIn">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/products?categoryId=${c.id}`}
                      onClick={() => setIsCategoryOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <span>{c.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-6 text-slate-600 dark:text-zinc-300">
              <Link href="/products?filter=deals" className="hover:underline font-bold" style={{ color: primaryColor }}>
                Deals & Coupons
              </Link>
              <Link href="/products?category=Grocery" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                Grocery
              </Link>
              <Link href="/products?category=Fashion" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                Fashion
              </Link>
              <Link href="/products?category=Electronics" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                Electronics
              </Link>
              <Link href="/products?category=Home" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                Home & Living
              </Link>
              <Link href="/products?category=Beauty" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                Beauty & Care
              </Link>
            </div>

            <div className="flex items-center gap-4 text-slate-500 dark:text-zinc-400">
              <Link href="/track-order" className="hover:text-slate-900 dark:hover:text-white transition-colors">
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
