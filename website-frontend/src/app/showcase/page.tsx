"use client";

import React, { useMemo, useState } from "react";
import { useWebsite } from "@/context/WebsiteContext";

export default function ShowcasePage() {
  const { site, products, categories } = useWebsite();
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [search, setSearch] = useState("");

  const pills = useMemo(
    () => ["ALL", ...categories.map((c) => c.name).filter(Boolean)],
    [categories]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((item) => {
      const catOk = selectedCategory === "ALL" || (item.categoryName || "") === selectedCategory;
      const qOk = !q || (item.name || "").toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [products, selectedCategory, search]);

  return (
    <div className="page-enter w-full">
      <section
        className="w-full py-12 text-white"
        style={{ background: `linear-gradient(135deg, #0f172a 0%, ${site.accent} 100%)` }}
      >
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-white/75 mb-1">
              {site.preset.label}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black">{site.preset.catalogHeading}</h1>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search showcase..."
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm w-full sm:w-72 focus:outline-none shadow"
          />
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-10 space-y-6">
        <div className="flex flex-wrap gap-2">
          {pills.map((name) => {
            const active = selectedCategory === name;
            return (
              <button
                key={name}
                onClick={() => setSelectedCategory(name)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition ${
                  active
                    ? "text-white border-transparent shadow"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                style={active ? { backgroundColor: site.accent } : undefined}
              >
                {name === "ALL" ? "All Items" : name}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-sm text-slate-500">
            No showcase items available in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="card-3d bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col"
              >
                <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-slate-300">SP</span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: site.accent }}>
                    {p.categoryName || "Featured"}
                  </div>
                  <div className="font-bold text-sm text-slate-900 line-clamp-2">{p.name}</div>
                  <div className="font-black text-base text-slate-800 pt-1">
                    ৳{Number(p.sellingPrice || p.price || 0).toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
