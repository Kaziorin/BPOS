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
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { StorefrontAPI, CategoryItem } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const { cartCount, setIsDrawerOpen } = useCart();
  const { customer, logout } = useAuth();
  const { config, storeName, businessType } = useStoreConfig();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    StorefrontAPI.getCategories().then(setCategories).catch(console.error);
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
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/30 border border-sky-400/30 text-sky-200 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase">
              {businessType}
            </span>
            <span className="hidden sm:inline">✨ Shop authentic products directly with real-time stock sync!</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/track-order" className="flex items-center gap-1.5 hover:text-sky-200 transition-colors">
              <Truck className="w-3.5 h-3.5" />
              <span>Track Order</span>
            </Link>
            {config?.tenant?.phone && (
              <div className="hidden md:flex items-center gap-1 text-slate-300">
                <Phone className="w-3.5 h-3.5" />
                <span>{config.tenant.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-sky-700 flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/10 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-sky-700 bg-clip-text text-transparent">
                {storeName}
              </span>
              <span className="block text-[10px] font-medium text-slate-400 tracking-wider uppercase">
                Official Online Store
              </span>
            </div>
          </Link>

          {/* Dynamic Categories Dropdown */}
          {categories.length > 0 && (
            <div className="hidden lg:relative lg:block">
              <button
                type="button"
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
                    Store Categories
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    <Link
                      href="/products"
                      onClick={() => setIsCategoryOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                    >
                      <span>🏷️</span>
                      <span>All Products</span>
                    </Link>
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/products?categoryId=${cat.id}`}
                        onClick={() => setIsCategoryOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                      >
                        <span className="font-medium truncate">{cat.name}</span>
                        {cat.productCount ? (
                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {cat.productCount}
                          </span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl relative">
            <div className="relative">
              <input
                type="text"
                placeholder={`Search in ${storeName}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-24 py-2.5 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 placeholder-slate-400 rounded-full border border-transparent focus:border-sky-500 focus:ring-4 focus:ring-sky-100 focus:outline-hidden transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-slate-900 hover:bg-sky-600 text-white rounded-full text-xs font-semibold transition-colors flex items-center gap-1"
              >
                Search
              </button>
            </div>
          </form>

          {/* Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Account */}
            <div className="relative">
              {customer ? (
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                    {customer.name?.charAt(0) || "U"}
                  </div>
                  <span className="hidden md:inline text-xs font-semibold max-w-[100px] truncate">
                    {customer.name}
                  </span>
                </button>
              ) : (
                <Link
                  href="/track-order"
                  className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  <User className="w-5 h-5 text-slate-600" />
                  <span className="hidden sm:inline">Track Order</span>
                </Link>
              )}

              {isUserMenuOpen && customer && (
                <div
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-sm"
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-800 truncate">{customer.name}</p>
                    <p className="text-xs text-slate-400 truncate">{customer.phone}</p>
                  </div>
                  <Link
                    href="/track-order"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block px-4 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    My Orders
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-sky-600 text-white transition-all shadow-md shadow-slate-900/10 active:scale-95 flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-bold">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4">
          <div className="font-bold text-xs uppercase tracking-wider text-slate-400">Categories</div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800"
            >
              🏷️ All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?categoryId=${cat.id}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 text-xs font-medium text-slate-700 truncate"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
