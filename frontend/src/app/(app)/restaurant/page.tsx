"use client";

import React, { useState } from "react";
import { UtensilsCrossed, LayoutGrid, Flame, PieChart, Info } from "lucide-react";
import FloorPlanView from "@/components/restaurant/FloorPlanView";
import KDSView from "@/components/restaurant/KDSView";
import RecipeManager from "@/components/restaurant/RecipeManager";

type TabType = "floors" | "kds" | "recipes";

export default function RestaurantPage() {
  const [activeTab, setActiveTab] = useState<TabType>("floors");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900 border border-indigo-500/20 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-2xl shadow-inner">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Restaurant Module</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                Active (§11.1 / Prompt 20)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Floor plan management, KOT & KDS station routing, table transfer/merge, and automated Recipe BOM ingredient costing.
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          id="tab-btn-floors"
          onClick={() => setActiveTab("floors")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "floors"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900/60"
          }`}
        >
          <LayoutGrid className="w-4 h-4" /> Floor Plan & Tables
        </button>
        <button
          id="tab-btn-kds"
          onClick={() => setActiveTab("kds")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "kds"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900/60"
          }`}
        >
          <Flame className="w-4 h-4" /> Kitchen Display (KDS)
        </button>
        <button
          id="tab-btn-recipes"
          onClick={() => setActiveTab("recipes")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "recipes"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900/60"
          }`}
        >
          <PieChart className="w-4 h-4" /> Recipe BOM & Food Costing
        </button>
      </div>

      {/* Active Tab View Content */}
      <div className="pt-2">
        {activeTab === "floors" && <FloorPlanView />}
        {activeTab === "kds" && <KDSView />}
        {activeTab === "recipes" && <RecipeManager />}
      </div>
    </div>
  );
}
