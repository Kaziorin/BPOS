"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
  Check,
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
  const [isSearchCatOpen, setIsSearchCatOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    StorefrontAPI.getCategories()
      .then((cats) => setCategories(Array.isArray(cats) ? cats : []))
      .catch(() => {});
    if (typeof window !== "undefined") {
      try {
        const wl = JSON.parse(localStorage.getItem("wishlist") || "[]");
        setWishlistCount(Array.isArray(wl) ? wl.length : 0);
      } catch {
        setWishlistCount(0);
      }
      setNotifCount(0);
    }
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
                className={`w-full h-11 flex items-center rounded-lg border px-3.5 transition-colors ${
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

                {/* Category selector inside Search (Custom Orange Dropdown) */}
                <div className={`relative border-l pl-2.5 ml-2 shrink-0 ${isDark ? "border-zinc-700" : "border-orange-200"}`}>
                  <button
                    type="button"
                    onClick={() => setIsSearchCatOpen((v) => !v)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      isDark
                        ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                        : "bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100"
                    }`}
                  >
                    <span className="max-w-[110px] truncate">
                      {selectedCat === "All Categories"
                        ? "All Categories"
                        : categories.find((c) => c.id === selectedCat)?.name || "All Categories"}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  </button>

                  {isSearchCatOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsSearchCatOpen(false)} />
                      <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-xl p-1.5 z-50 ${
                        isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-stone-200"
                      }`}>
                        <div className="space-y-0.5 max-h-72 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-stone-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCat("All Categories");
                              setIsSearchCatOpen(false);
                            }}
                            className={`w-full flex items-center justify-between text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                              selectedCat === "All Categories"
                                ? isDark
                                  ? "bg-orange-500/20 text-orange-300 font-semibold"
                                  : "bg-orange-50 text-orange-700 font-semibold"
                                : isDark
                                ? "text-zinc-200 hover:bg-zinc-800"
                                : "text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            <span>All Categories</span>
                            {selectedCat === "All Categories" && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                          </button>
                          {categories.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCat(c.id);
                                setIsSearchCatOpen(false);
                              }}
                              className={`w-full flex items-center justify-between gap-2 text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                selectedCat === c.id
                                  ? isDark
                                    ? "bg-orange-500/20 text-orange-300 font-semibold"
                                    : "bg-orange-50 text-orange-700 font-semibold"
                                  : isDark
                                  ? "text-zinc-200 hover:bg-zinc-800"
                                  : "text-stone-700 hover:bg-stone-100"
                              }`}
                            >
                              <span className="truncate">{c.name}</span>
                              {selectedCat === c.id && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
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
                    isDark ? "bg-zinc-900 border-zinc-700 divide-zinc-800" : "bg-[#FFF7ED] border-orange-200 divide-orange-100"
                  }`}>
                    <div className={`p-3 flex items-center justify-between text-[11px] font-semibold ${
                      isDark ? "bg-zinc-800/60 text-zinc-400" : "bg-orange-100/70 text-orange-900"
                    }`}>
                      <span>Live Results ({searchResults.length})</span>
                      <button
                        type="button"
                        onClick={() => setShowSearchDropdown(false)}
                        className="text-stone-500 hover:text-orange-700 cursor-pointer"
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
                            isDark ? "hover:bg-zinc-800" : "hover:bg-orange-100/70"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-md border overflow-hidden shrink-0 flex items-center justify-center ${
                              isDark ? "bg-zinc-800 border-zinc-700" : "bg-white border-orange-200"
                            }`}>
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <ShoppingBag className="w-4 h-4 text-orange-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-stone-900 group-hover:text-orange-700"}`}>
                                {item.name}
                              </h4>
                              <span className="text-[10px] text-stone-500 font-normal">
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

                    <div className={`p-2.5 text-center border-t ${isDark ? "bg-zinc-800/40 border-zinc-800" : "bg-orange-100/60 border-orange-200"}`}>
                      <Link
                        href={`/products?search=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={() => setShowSearchDropdown(false)}
                        className="text-xs font-semibold text-orange-700 hover:underline inline-flex items-center gap-1"
                      >
                        <span>View all matching products</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Action Icons: Wishlist, Notification, Cart, Sign In */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Wishlist with Corner Count Badge */}
              <Link
                href="/products"
                className={`relative h-10 w-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                  isDark
                    ? "text-zinc-200 hover:bg-zinc-800"
                    : "text-stone-700 hover:bg-orange-100/70 hover:text-orange-700"
                }`}
                title="Wishlist"
              >
                <Heart className="w-6 h-6" />
                <span className={`absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-[10px] leading-none tabular-nums font-mono ring-2 ${
                  isDark ? "ring-zinc-950" : "ring-[#FFF7ED]"
                }`}>
                  {wishlistCount}
                </span>
              </Link>

              {/* Notification with Corner Count Badge & Popover */}
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => setIsNotifOpen((v) => !v)}
                  className={`relative h-10 w-10 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    isDark
                      ? "text-zinc-200 hover:bg-zinc-800"
                      : "text-stone-700 hover:bg-orange-100/70 hover:text-orange-700"
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-6 h-6" />
                  <span className={`absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-[10px] leading-none tabular-nums font-mono ring-2 ${
                    isDark ? "ring-zinc-950" : "ring-[#FFF7ED]"
                  }`}>
                    {notifCount}
                  </span>
                </button>

                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                    <div className={`absolute right-0 top-full mt-2 w-72 rounded-xl border shadow-xl p-3 z-50 ${
                      isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-stone-200 text-stone-800"
                    }`}>
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
                        <span className="text-xs font-semibold">Notifications</span>
                        <span className="text-[11px] text-stone-400">{notifCount} unread</span>
                      </div>
                      <p className="text-xs text-stone-500 py-3 text-center">
                        No new notifications right now.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Cart with Corner Count Badge */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className={`relative h-10 w-10 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? "text-zinc-200 hover:bg-zinc-800"
                    : "text-stone-700 hover:bg-orange-100/70 hover:text-orange-700"
                }`}
                title="Shopping Cart"
              >
                <ShoppingBag className="w-6 h-6" />
                <span className={`absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-[10px] leading-none tabular-nums font-mono ring-2 ${
                  isDark ? "ring-zinc-950" : "ring-[#FFF7ED]"
                }`}>
                  {cartCount}
                </span>
              </button>

              {/* User Account / Sign In Button */}
              <div className="relative flex items-center ml-1">
                {customer || adminUser ? (
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`h-9 flex items-center gap-2 px-2.5 rounded-full border transition-colors cursor-pointer ${
                      isDark ? "bg-zinc-900 border-zinc-700 hover:bg-zinc-800" : "bg-white border-orange-200 hover:bg-orange-50"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-[10px]">
                      {(adminUser?.name || customer?.name || "U")[0].toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left leading-tight pr-0.5">
                      <span className={`block text-xs font-semibold truncate max-w-[90px] ${isDark ? "text-white" : "text-stone-900"}`}>
                        {adminUser?.name || customer?.name}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
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

            </div>

          </div>
        </div>

        {/* Categories Navigation Bar */}
        <div className={`border-t hidden sm:block ${
          isDark ? "border-zinc-800 bg-zinc-900 text-zinc-200" : "border-orange-100 bg-white text-stone-700"
        }`}>
          <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 flex items-center justify-between h-11 text-xs font-medium">
            
            <div className="flex items-center gap-6">
              {/* All Categories Trigger */}
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="h-11 flex items-center gap-2 px-4 rounded-none bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Menu className="w-4 h-4" />
                  <span>All Categories</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                </button>

                {/* Categories Dropdown */}
                {isCategoryOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCategoryOpen(false)} />
                    <div className={`absolute left-0 top-full mt-0 w-56 rounded-none border shadow-xl p-1.5 z-50 ${
                      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-stone-200"
                    }`}>
                      {categories.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-stone-400">No categories yet</div>
                      ) : (
                        <div className="space-y-0.5 max-h-72 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-stone-200">
                          {categories.map((c) => (
                            <Link
                              key={c.id}
                              href={`/products?categoryId=${c.id}`}
                              onClick={() => setIsCategoryOpen(false)}
                              className={`flex items-center justify-between px-3 py-1.5 rounded-none text-xs transition-colors ${
                                isDark ? "text-zinc-200 hover:bg-zinc-800" : "text-stone-700 hover:bg-orange-50 hover:text-orange-700"
                              }`}
                            >
                              <span className="truncate">{c.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Essential E-Commerce Nav Links with Active Route Highlight */}
              <Suspense fallback={null}>
                <BottomNavLinks isDark={isDark} />
              </Suspense>
            </div>

            <Suspense fallback={null}>
              <TrackOrderNavLink isDark={isDark} />
            </Suspense>

          </div>
        </div>

      </header>

      {/* Auth Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}

function BottomNavLinks({ isDark }: { isDark: boolean }) {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isShop = pathname === "/products";
  const isAbout = pathname === "/about";
  const isContact = pathname === "/contact";

  const linkClass = (active: boolean) =>
    `h-11 inline-flex items-center border-b-2 transition-colors text-xs ${
      active
        ? "border-orange-600 text-orange-600 font-semibold"
        : isDark
        ? "border-transparent text-zinc-300 hover:text-white font-medium"
        : "border-transparent text-stone-700 hover:text-orange-600 font-medium"
    }`;

  return (
    <nav className="flex items-center gap-6">
      <Link href="/" className={linkClass(isHome)}>
        Home
      </Link>
      <Link href="/products" className={linkClass(isShop)}>
        Shop
      </Link>
      <Link href="/about" className={linkClass(isAbout)}>
        About
      </Link>
      <Link href="/contact" className={linkClass(isContact)}>
        Contact
      </Link>
    </nav>
  );
}

function TrackOrderNavLink({ isDark }: { isDark: boolean }) {
  const pathname = usePathname();
  const isTrack = pathname.startsWith("/track-order");

  return (
    <Link
      href="/track-order"
      className={`h-11 flex items-center gap-1.5 border-b-2 text-xs transition-colors ${
        isTrack
          ? "border-orange-600 text-orange-600 font-semibold"
          : isDark
          ? "border-transparent text-zinc-300 hover:text-white font-medium"
          : "border-transparent text-stone-600 hover:text-orange-600 font-medium"
      }`}
    >
      <Truck className="w-3.5 h-3.5" />
      <span>Track Order</span>
    </Link>
  );
}
