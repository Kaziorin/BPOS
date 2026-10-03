"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Utensils, Flame, Sparkles, Plus, Clock, Star } from "lucide-react";
import { SectionItem } from "@/lib/builderTypes";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

interface RestaurantMenuSectionProps {
  section: SectionItem;
  isDarkMode?: boolean;
}

export default function RestaurantMenuSection({ section, isDarkMode = false }: RestaurantMenuSectionProps) {
  const {
    title = "Chef's Handcrafted Specialties & Popular Platters",
    subtitle = "Prepared fresh upon order with authentic gourmet ingredients and rich flavorful spices.",
    badge = "GOURMET KITCHEN",
    settings = {},
  } = section;

  const { addToCart } = useCart();

  const defaultItems = [
    {
      id: "dish-1",
      name: "Smoked BBQ Beef Burger Platter",
      category: "Burgers",
      price: 450,
      oldPrice: 550,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
      description: "Juicy double patty, caramelised onions, melted cheddar & crisp potato wedges.",
      prepTime: "20-25 mins",
      rating: 4.9,
    },
    {
      id: "dish-2",
      name: "Woodfired Truffle Mushroom Pizza",
      category: "Pizza",
      price: 780,
      oldPrice: 920,
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
      description: "Hand-stretched crust, wild mushrooms, fresh mozzarella & white truffle drizzle.",
      prepTime: "15-20 mins",
      rating: 4.8,
    },
    {
      id: "dish-3",
      name: "Hyderabadi Dum Mutton Biryani",
      category: "Main Course",
      price: 650,
      oldPrice: 750,
      image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80",
      description: "Slow-cooked fragrant basmati rice layered with tender mutton shank & saffron.",
      prepTime: "25-30 mins",
      rating: 5.0,
    },
    {
      id: "dish-4",
      name: "Crispy Peri Peri Fried Wings (8pcs)",
      category: "Appetizers",
      price: 320,
      oldPrice: 380,
      image: "https://images.unsplash.com/photo-1527477321055-436158a2b0a5?w=500&auto=format&fit=crop&q=80",
      description: "Golden crunchy wings glazed in signature smoky peri peri spice blend & dip.",
      prepTime: "12-15 mins",
      rating: 4.9,
    },
  ];

  const items = settings.menuItems || defaultItems;
  const categories = ["All Dishes", ...Array.from(new Set(items.map((i: any) => i.category)))];
  const [selectedCategory, setSelectedCategory] = useState("All Dishes");

  const filteredItems = selectedCategory === "All Dishes"
    ? items
    : items.filter((i: any) => i.category === selectedCategory);

  const handleQuickAdd = (item: any) => {
    addToCart({
      id: String(item.id || item.name),
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
    } as any);
    toast.success(`Added ${item.name} to cart!`);
  };

  return (
    <section className={`py-12 px-4 sm:px-6 lg:px-8 transition-colors ${isDarkMode ? "bg-zinc-950 text-white" : "bg-white text-slate-900"}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            {badge && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <Utensils className="w-3.5 h-3.5" />
                <span>{badge}</span>
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h2>
            {subtitle && (
              <p className={`text-sm ${isDarkMode ? "text-zinc-400" : "text-slate-600"}`}>{subtitle}</p>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((cat: any) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : isDarkMode
                    ? "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems.map((dish: any, idx: number) => (
            <div
              key={idx}
              className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-xl ${
                isDarkMode
                  ? "bg-zinc-900/80 border-zinc-800 hover:border-orange-500/50"
                  : "bg-white border-slate-200 hover:border-orange-400"
              }`}
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{dish.rating}</span>
                  </div>
                  {dish.prepTime && (
                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-slate-800 dark:text-zinc-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3 text-orange-500" />
                      <span>{dish.prepTime}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
                    {dish.category}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base line-clamp-1">{dish.name}</h3>
                  <p className={`text-xs line-clamp-2 ${isDarkMode ? "text-zinc-400" : "text-slate-500"}`}>
                    {dish.description}
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 pt-0 flex items-center justify-between">
                <div>
                  <div className="text-base font-black text-orange-600 dark:text-orange-400">
                    ৳{dish.price}
                  </div>
                  {dish.oldPrice && (
                    <div className="text-[11px] text-slate-400 line-through">
                      ৳{dish.oldPrice}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickAdd(dish)}
                  className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 shadow-md shadow-orange-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Order</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
