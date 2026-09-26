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
  Sparkles,
  ChevronDown
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { StorefrontAPI, CategoryItem, StoreConfig } from "@/lib/api";

const BUSINESS_TYPES = [
  { id: "ALL", label: "All Stores", icon: "🌐" },
  { id: "FASHION", label: "Fashion & Apparel", icon: "👗" },
  { id: "GROCERY", label: "Grocery & Supermarket", icon: "🛒" },
  { id: "PHARMACY", label: "Pharmacy & Medicine", icon: "💊" },
  { id: "RESTAURANT", label: "Restaurant & Cafe", icon: "🍔" },
  { id: "ELECTRONICS", label: "Electronics & Tech", icon: "⚡" },
  { id: "FOOTWEAR", label: "Footwear & Shoes", icon: "👟" },
  { id: "COSMETICS", label: "Beauty & Cosmetics", icon: "💄" },
  { id: "HARDWARE", label: "Hardware & Tools", icon: "🔧" },
];

export default function Navbar() {
  const router = useRouter();
  const { cartCount, setIsDrawerOpen } = useCart();
  const { customer, logout } = useAuth();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    StorefrontAPI.getCategories().then(setCategories).catch(console.error);
    StorefrontAPI.getConfig().then(setConfig).catch(console.error);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Notification Bar */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-700 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase">
              Omnichannel Ready
            </span>
            <span>✨ Shop online with real-time stock sync & instant store dispatch!</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/track-order" className="flex items-center gap-1.5 hover:text-sky-200 transition-colors">
              <Truck className="w-3.5 h-3.5" />
              <span>Track Order</span>
            </Link>
            <div className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              <span>Hotline: {config?.tenant?.phone || "+880 1700-000000"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-sky-900 to-sky-700 bg-clip-text text-transparent">
                {config?.tenant?.name || "BlueOceans"}
              </span>
              <span className="block text-[10px] font-medium text-sky-600 tracking-wider uppercase">
                Online Storefront
              </span>
            </div>
          </Link>

          {/* Business Type Quick Filter Dropdown */}
          <div className="hidden lg:relative lg:block">
            <button
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
            >
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Categories</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isCategoryOpen && (
              <div
                onMouseLeave={() => setIsCategoryOpen(false)}
                className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Store Types & Catalogs
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {BUSINESS_TYPES.map((bt) => (
                    <Link
                      key={bt.id}
                      href={bt.id === "ALL" ? "/products" : `/products?businessType=${bt.id}`}
                      onClick={() => setIsCategoryOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                    >
                      <span className="text-lg">{bt.icon}</span>
                      <span className="font-medium">{bt.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products by name, SKU, brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-24 py-2.5 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 placeholder-slate-400 rounded-full border border-transparent focus:border-sky-500 focus:ring-4 focus:ring-sky-100 focus:outline-none transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-full text-xs font-semibold shadow-xs hover:shadow transition-all"
              >
                Search
              </button>
            </div>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* User Profile / Login */}
            <div className="relative">
              {customer ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors text-sm font-medium"
                  >
                    <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
                      {customer.name.charAt(0)}
                    </div>
                    <span className="hidden sm:inline max-w-[100px] truncate">{customer.name}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{customer.name}</p>
                      </div>
                      <Link
                        href="/track-order"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        My Orders
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/track-order"
                  className="p-2 text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-full transition-colors"
                  title="Track Order & Sign In"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}
            </div>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 transition-all font-medium text-sm group"
            >
              <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white text-sky-700 rounded-full text-xs font-bold shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-4 space-y-3 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-2">
              {BUSINESS_TYPES.map((bt) => (
                <Link
                  key={bt.id}
                  href={bt.id === "ALL" ? "/products" : `/products?businessType=${bt.id}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-xs font-medium text-slate-700"
                >
                  <span>{bt.icon}</span>
                  <span className="truncate">{bt.label}</span>
                </Link>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/track-order"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-slate-700 font-medium py-2"
              >
                <Truck className="w-4 h-4 text-sky-600" />
                Track Order
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
