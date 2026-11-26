"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Filter,
  Search,
  SlidersHorizontal,
  X,
  ShoppingBag,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { StorefrontAPI, ProductItem, CategoryItem } from "@/lib/api";
import DynamicProductCard from "@/components/products/DynamicProductCard";
import { useStoreConfig } from "@/context/StoreConfigContext";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { storeName } = useStoreConfig();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categoryId") || "");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brandId") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
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
    const qBrand = searchParams.get("brandId") || "";
    const qSort = searchParams.get("sort") || "newest";

    setSearch(qSearch);
    setSelectedCategory(qCat);
    setSelectedBrand(qBrand);
    setSort(qSort);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await StorefrontAPI.getProducts({
          search: search || undefined,
          categoryId: selectedCategory || undefined,
          brandId: selectedBrand || undefined,
          sort,
          page,
          limit: 16,
        });

        let items = res.items || [];
        if (inStockOnly) {
          items = items.filter((p) => (p.totalStock ?? 0) > 0 || p.inStock);
        }

        setProducts(items);
        setTotalCount(res.total || items.length);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [search, selectedCategory, selectedBrand, sort, inStockOnly, page]);

  const clearAllFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedBrand("");
    setSort("newest");
    setInStockOnly(false);
    setPage(1);
    router.push("/products");
  };

  const hasActiveFilters = Boolean(search || selectedCategory || selectedBrand || inStockOnly);

  const selectedCategoryName = categories.find((c) => c.id === selectedCategory)?.name;
  const selectedBrandName = brands.find((b) => b.id === selectedBrand)?.name;

  const headingTail =
    sort === "popular" && searchParams.get("sort") === "popular"
      ? "Popular Items"
      : sort === "newest" && searchParams.get("sort") === "newest"
      ? "New Arrivals"
      : "Shop";

  const renderFiltersPanel = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-3.5 border-b border-orange-100">
        <div className="flex items-center gap-2 font-semibold !text-stone-900 text-sm">
          <SlidersHorizontal className="w-4 h-4 text-orange-600" />
          <span>Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold !text-stone-600 uppercase tracking-wider block">
          Search
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-[#FAF5EE] border border-orange-200/80 rounded-xl text-xs !text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:border-orange-500 transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold !text-stone-600 uppercase tracking-wider block">
          Category
        </label>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("");
              setPage(1);
              setIsMobileFilterOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
              !selectedCategory
                ? "bg-[#FFF1E0] border border-orange-200/80 !text-orange-700 font-semibold"
                : "!text-stone-700 hover:bg-[#FAF5EE]"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setPage(1);
                setIsMobileFilterOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-[#FFF1E0] border border-orange-200/80 !text-orange-700 font-semibold"
                  : "!text-stone-700 hover:bg-[#FAF5EE]"
              }`}
            >
              <span className="truncate">{cat.name}</span>
              {cat.productCount !== undefined && (
                <span className="text-[10px] text-stone-400 tabular-nums">({cat.productCount})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Brands Filter */}
      {brands.length > 0 && (
        <div className="space-y-2">
          <label className="text-[11px] font-semibold !text-stone-600 uppercase tracking-wider block">
            Brand
          </label>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => {
                setSelectedBrand("");
                setPage(1);
                setIsMobileFilterOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                !selectedBrand
                  ? "bg-[#FFF1E0] border border-orange-200/80 !text-orange-700 font-semibold"
                  : "!text-stone-700 hover:bg-[#FAF5EE]"
              }`}
            >
              All Brands
            </button>
            {brands.map((b) => (
              <button
                type="button"
                key={b.id}
                onClick={() => {
                  setSelectedBrand(b.id);
                  setPage(1);
                  setIsMobileFilterOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                  selectedBrand === b.id
                    ? "bg-[#FFF1E0] border border-orange-200/80 !text-orange-700 font-semibold"
                    : "!text-stone-700 hover:bg-[#FAF5EE]"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* In Stock Only Toggle */}
      <label className="pt-3 border-t border-orange-100 flex items-center justify-between cursor-pointer select-none">
        <span className="text-xs font-semibold !text-stone-700">In Stock Only</span>
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => setInStockOnly(e.target.checked)}
          className="w-4 h-4 accent-orange-600 rounded border-orange-300 cursor-pointer"
        />
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 py-8 sm:py-10 space-y-6">
        {/* Clean Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-orange-200/70">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight !text-stone-900">
              {storeName || "SalePay"}{" "}
              <span className="text-orange-600">{headingTail}</span>
            </h1>
            <p className="text-xs sm:text-sm !text-stone-600 mt-1">
              Showing {products.length} of {totalCount} products
            </p>
          </div>
        </div>

        {/* Main Layout: Sidebar Filters + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 bg-white p-5 rounded-2xl border border-orange-200/80 shadow-[0_2px_10px_-4px_rgba(234,88,12,0.06)] sticky top-24">
            {renderFiltersPanel()}
          </aside>

          {/* Product Grid Column */}
          <div className="lg:col-span-9 space-y-5">
            {/* Top Sort & Active Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-orange-200/80 shadow-[0_2px_10px_-4px_rgba(234,88,12,0.06)]">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF1E0] border border-orange-200 font-semibold !text-orange-700 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filters{hasActiveFilters ? " •" : ""}</span>
                </button>

                {search && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF5EE] border border-orange-200/80 !text-stone-700 font-medium">
                    <span>&ldquo;{search}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="text-stone-400 hover:text-orange-600 cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedCategoryName && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF1E0] border border-orange-200 !text-orange-700 font-semibold">
                    <span>{selectedCategoryName}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("")}
                      className="text-orange-500 hover:text-orange-700 cursor-pointer"
                      aria-label="Clear category"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedBrandName && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF1E0] border border-orange-200 !text-orange-700 font-semibold">
                    <span>{selectedBrandName}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedBrand("")}
                      className="text-orange-500 hover:text-orange-700 cursor-pointer"
                      aria-label="Clear brand"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {sort === "popular" && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#FFF1E0] border border-orange-200 !text-orange-700 font-semibold">
                    Popular Items
                  </span>
                )}
                {sort === "newest" && !selectedCategoryName && !search && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#FFF1E0] border border-orange-200 !text-orange-700 font-semibold">
                    New Arrivals
                  </span>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 ml-auto">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs font-semibold bg-[#FAF5EE] border border-orange-200/80 rounded-xl px-3 py-1.5 !text-stone-800 focus:outline-hidden focus:border-orange-500 cursor-pointer"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="popular">Popular Items</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>
            </div>

            {/* Product Items Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-80 bg-orange-100/50 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-orange-200/80 p-8 space-y-4">
                <ShoppingBag className="w-11 h-11 text-orange-300 mx-auto" />
                <div>
                  <h3 className="text-base font-semibold !text-stone-900">No products match your criteria</h3>
                  <p className="text-xs !text-stone-500 mt-1 max-w-sm mx-auto">
                    Try adjusting your filters, selecting another category, or clearing search.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 !text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {products.map((product) => (
                    <DynamicProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-orange-200/80 bg-white text-xs font-semibold !text-stone-700 hover:border-orange-400 hover:!text-orange-600 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    <span className="px-3 py-1.5 text-xs font-semibold !text-stone-700 tabular-nums">
                      Page {page} of {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-orange-200/80 bg-white text-xs font-semibold !text-stone-700 hover:border-orange-400 hover:!text-orange-600 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative z-10 w-80 max-w-[85vw] bg-white h-full p-5 overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold !text-stone-900">Filter Products</span>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderFiltersPanel()}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] max-w-[1720px] 2xl:max-w-[1800px] mx-auto p-12 text-center text-sm text-stone-500">
          Loading catalog...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
