"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  Laptop,
  Home,
  Shirt,
  Sparkles,
  ShoppingBag,
  Activity,
  Gamepad2,
  BookOpen,
  Car,
  HeartPulse,
  Watch,
  Armchair,
  Dog,
  ChevronRight,
  Download,
  HelpCircle,
  Phone,
  MessageSquare,
  Layers,
} from "lucide-react";
import { CategoryItem } from "@/lib/api";

interface Props {
  categories: CategoryItem[];
  isDarkMode?: boolean;
}

const ICONS = [
  Smartphone,
  Laptop,
  Home,
  Shirt,
  Sparkles,
  ShoppingBag,
  Activity,
  Gamepad2,
  BookOpen,
  Car,
  HeartPulse,
  Watch,
  Armchair,
  Dog,
];

export default function SidebarCategoryNav({ categories, isDarkMode }: Props) {
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

  const displayCats =
    categories.length > 0
      ? categories
      : [
          { id: "1", name: "Electronics & Gadgets" },
          { id: "2", name: "Mobile Phones & Accs" },
          { id: "3", name: "Computers & Laptops" },
          { id: "4", name: "Home & Living" },
          { id: "5", name: "Fashion & Clothing" },
          { id: "6", name: "Beauty & Personal Care" },
          { id: "7", name: "Groceries & Supermarket" },
          { id: "8", name: "Sports & Outdoors" },
          { id: "9", name: "Toys & Baby Items" },
          { id: "10", name: "Books & Stationery" },
          { id: "11", name: "Health & Wellness" },
          { id: "12", name: "Jewelry & Watches" },
        ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-4">
      {/* Categories Card */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-xs ${
          isDarkMode
            ? "bg-zinc-900 border-zinc-800 text-white"
            : "bg-white border-slate-200/80 text-slate-800"
        }`}
      >
        <div className="p-3.5 border-b border-slate-100 dark:border-zinc-800 bg-sky-600 text-white flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <h3 className="text-xs font-black uppercase tracking-wider">All Categories</h3>
        </div>

        <nav className="p-2 space-y-0.5 max-h-[480px] overflow-y-auto">
          {displayCats.map((c, idx) => {
            const Icon = ICONS[idx % ICONS.length];
            return (
              <Link
                key={c.id || idx}
                href={`/products?categoryId=${c.id || ""}`}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-sky-50 dark:hover:bg-zinc-800 hover:text-sky-600 dark:hover:text-sky-400 transition-colors group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-sky-600 dark:group-hover:text-sky-400 shrink-0" />
                  <span className="truncate">{c.name}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Download App Card */}
      <div
        className={`p-4 rounded-2xl border text-center relative overflow-hidden ${
          isDarkMode
            ? "bg-gradient-to-br from-indigo-950 to-zinc-900 border-zinc-800 text-white"
            : "bg-gradient-to-br from-sky-50 to-indigo-50 border-sky-200/70 text-slate-900"
        }`}
      >
        <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
          <Download className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-black">Download Our App</h4>
        <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 mb-3">
          Shop anytime, anywhere with exclusive mobile deals!
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded-md">App Store</span>
          <span className="bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded-md">Google Play</span>
        </div>
      </div>

      {/* Need Help Card */}
      <div
        className={`p-4 rounded-2xl border space-y-2 text-xs ${
          isDarkMode
            ? "bg-zinc-900 border-zinc-800 text-zinc-300"
            : "bg-white border-slate-200 text-slate-600"
        }`}
      >
        <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
          <HelpCircle className="w-4 h-4 text-sky-600" />
          <span>Need Help?</span>
        </h4>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>24/7 Live Support</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-sky-500" />
            <span>+880 1700-000000</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
