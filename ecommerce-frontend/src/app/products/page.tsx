"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Filter,
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  ShoppingBag,
  Sparkles,
  Layers,
  ArrowUpDown
} from "lucide-react";
import { StorefrontAPI, ProductItem, CategoryItem, StoreConfig } from "@/lib/api";
import ProductCard from "@/components/products/ProductCard";

const BUSINESS_TYPES = [
  { id: "ALL", label: "All Items" },
  { id: "FASHION", label: "Fashion" },
  { id: "GROCERY", label: "Grocery" },
  { id: "PHARMACY", label: "Pharmacy" },
  { id: "RESTAURANT", label: "Restaurant" },
  { id: "ELECTRONICS", label: "Electronics" },
  { id: "FOOTWEAR", label: "Footwear" },
  { id: "COSMETICS", label: "Cosmetics" },
  { id: "HARDWARE", label: "Hardware" },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categoryId") || "");
  const [selectedBusinessType, setSelectedBusinessType] = useState(searchParams.get("businessType") || "ALL");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brandId") || "");
  const [sort, setSort] = useState("newest");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    StorefrontAPI.getCategories().then(setCategories).catch(console.error);
    StorefrontAPI.getBrands().then(setBrands).catch(console.error);
  }, []);

  useEffect(() => {
    const qSearch = searchParams.get("search") || "";
    const qCat = searchParams.get("categoryId") || "";
    const qBt = searchParams.get("businessType") || "ALL";

    setSearch(qSearch);
    setSelectedCategory(qCat);
    setSelectedBusinessType(qBt);
  }, [searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await StorefrontAPI.getProducts({
        search: search.trim() || undefined,
        categoryId: selectedCategory || undefined,
        brandId: selectedBrand || undefined,
        businessType: selectedBusinessType !== "ALL" ? selectedBusinessType : undefined,
        sort,
        page,
        limit: 24,
      });

      let items = res.items || [];
      if (inStockOnly) {
        items = items.filter((p) => (p.totalStock ?? 0) > 0);
      }

      setProducts(items);
      setTotalCount(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, selectedBrand, selectedBusinessType, sort, inStockOnly, page]);

  const clearAllFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedBusinessType("ALL");
    setSelectedBrand("");
    setSort("newest");
    setInStockOnly(false);
    setPage(1);
    router.push("/products");
  };

  const hasActiveFilters = search || selectedCategory || selectedBusinessType !== "ALL" || selectedBrand || inStockOnly;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Product Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing {products.length} of {totalCount} authentic store items
          </p>
        </div>

        {/* Business Type Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {BUSINESS_TYPES.map((bt) => (
            <button
              key={bt.id}
              onClick={() => {
                setSelectedBusinessType(bt.id);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedBusinessType === bt.id
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {bt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Layout: Sidebar Filters + Product Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs h-fit sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <SlidersHorizontal className="w-4 h-4 text-sky-600" />
              <span>Filters</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Product keyword..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Category</label>
            <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
              <button
                onClick={() => {
                  setSelectedCategory("");
                  setPage(1);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !selectedCategory ? "bg-sky-50 text-sky-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setPage(1);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === cat.id ? "bg-sky-50 text-sky-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  {cat.productCount !== undefined && (
                    <span className="text-[10px] text-slate-400">({cat.productCount})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Brands Filter */}
          {brands.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Brand</label>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                <button
                  onClick={() => {
                    setSelectedBrand("");
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    !selectedBrand ? "bg-sky-50 text-sky-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  All Brands
                </button>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBrand(b.id);
                      setPage(1);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedBrand === b.id ? "bg-sky-50 text-sky-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* In Stock Only Switch */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">In Stock Only</span>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Top Sort & Filter Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters {hasActiveFilters && "•"}</span>
            </button>

            {/* Active Filters summary pills */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              {hasActiveFilters && (
                <span className="text-xs text-slate-400 font-medium">Active:</span>
              )}
              {selectedBusinessType !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full text-[11px] font-semibold">
                  Type: {selectedBusinessType}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedBusinessType("ALL")} />
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full text-[11px] font-semibold">
                  Category Filter
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory("")} />
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full text-[11px] font-semibold">
                  &quot;{search}&quot;
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch("")} />
                </span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Product Items Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-slate-200 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-slate-800">No products match your criteria</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Try adjusting your filters, selecting another category, or clearing the search box.
                </p>
              </div>
              <button
                onClick={clearAllFilters}
                className="px-5 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-slate-600 px-3">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading catalog...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
