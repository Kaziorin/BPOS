"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, Layers, Search, Sparkles, X } from "lucide-react";
import { ShowcaseProduct, useWebsite } from "@/context/WebsiteContext";
import HeroVfxCanvas from "@/components/HeroVfxCanvas";

type SortMode = "featured" | "price_asc" | "price_desc" | "name_asc";

export default function ShowcasePage() {
  const { site, products, categories } = useWebsite();
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("featured");
  const [activeItem, setActiveItem] = useState<ShowcaseProduct | null>(null);

  const pills = useMemo(
    () => ["ALL", ...categories.map((c) => c.name).filter(Boolean)],
    [categories]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((item) => {
      const catOk = selectedCategory === "ALL" || (item.categoryName || "") === selectedCategory;
      const qOk = !q || (item.name || "").toLowerCase().includes(q);
      return catOk && qOk;
    });

    if (sortBy === "price_asc") {
      return [...list].sort((a, b) => Number(a.sellingPrice || a.price || 0) - Number(b.sellingPrice || b.price || 0));
    }
    if (sortBy === "price_desc") {
      return [...list].sort((a, b) => Number(b.sellingPrice || b.price || 0) - Number(a.sellingPrice || a.price || 0));
    }
    if (sortBy === "name_asc") {
      return [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    return list;
  }, [products, selectedCategory, search, sortBy]);

  return (
    <div className="page-enter w-full">
      {/* VFX Hero Header */}
      <section
        className="relative w-full overflow-hidden py-14 sm:py-18 text-white"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${site.accent}55 0%, transparent 45%), linear-gradient(135deg, #060913 0%, #0f172a 50%, ${site.accent} 100%)`,
        }}
      >
        <HeroVfxCanvas variant={site.heroBgStyle} accent={site.accent} />
        <div className="relative z-10 max-w-[1680px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest text-white/90">
              <Sparkles className="w-3.5 h-3.5" />
              {site.tagline}
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
              {site.preset.catalogHeading}
            </h1>
            <p className="text-sm text-white/80">
              Explore {products.length} curated offerings across {categories.length || 1} categories at {site.storeName}.
            </p>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search showcase..."
              className="w-full pl-10 pr-9 py-3 rounded-2xl bg-white text-slate-900 text-sm font-medium focus:outline-none shadow-xl"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filter Toolbar & Grid */}
      <section className="max-w-[1680px] mx-auto px-5 sm:px-8 lg:px-12 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {pills.map((name) => {
              const active = selectedCategory === name;
              return (
                <button
                  key={name}
                  onClick={() => setSelectedCategory(name)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition ${active
                      ? "text-white border-transparent shadow-md"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  style={active ? { backgroundColor: site.accent } : undefined}
                >
                  {name === "ALL" ? "All Items" : name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-bold text-slate-500">{filtered.length} items</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortMode)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A – Z</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-4 shadow-sm">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Layers className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="font-extrabold text-lg text-slate-900">No showcase items found</div>
              <p className="text-sm text-slate-500">
                Try clearing your filters or contact {site.storeName} directly for our latest offerings.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-1">
              {(selectedCategory !== "ALL" || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("ALL");
                    setSearch("");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                >
                  Reset Filters
                </button>
              )}
              <Link
                href="/contact"
                className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow"
                style={{ backgroundColor: site.accent }}
              >
                Inquire With Us
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveItem(p)}
                className="group text-left card-3d bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl flex flex-col transition"
              >
                <div className="relative aspect-[4/3] w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <span className="text-4xl font-black text-slate-300">SP</span>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-[11px] font-extrabold shadow-lg transition">
                      <Eye className="w-3.5 h-3.5" />
                      Quick View
                    </span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-2 w-full">
                  <div
                    className="text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ color: site.accent }}
                  >
                    {p.categoryName || "Featured"}
                  </div>
                  <div className="font-bold text-sm text-slate-900 line-clamp-2">{p.name}</div>
                  <div className="font-black text-base text-slate-900 pt-1">
                    ৳{Number(p.sellingPrice || p.price || 0).toFixed(0)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Quick View Promotional Modal */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] bg-slate-100 flex items-center justify-center">
              {activeItem.imageUrl ? (
                <img src={activeItem.imageUrl} alt={activeItem.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-black text-slate-300">SP</span>
              )}
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className="text-xs font-extrabold uppercase tracking-wider"
                    style={{ color: site.accent }}
                  >
                    {activeItem.categoryName || "Featured Offering"}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">{activeItem.name}</h3>
                </div>
                <div className="text-2xl font-black text-slate-900 shrink-0">
                  ৳{Number(activeItem.sellingPrice || activeItem.price || 0).toFixed(0)}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Available at {site.storeName} ({site.address}). Contact our flagship desk for availability, reservations, or personalized assistance.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/contact"
                  onClick={() => setActiveItem(null)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-xs font-extrabold shadow"
                  style={{ backgroundColor: site.accent }}
                >
                  <span>Inquire / Visit Branch</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
