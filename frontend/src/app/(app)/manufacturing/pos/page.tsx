"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Factory,
  Layers,
  Search,
  Plus,
  Trash2,
  Receipt,
  Printer,
  ChevronLeft,
  Clock,
  CheckCircle2,
  DollarSign,
  PackageCheck,
  Flame,
  ArrowRight,
  TrendingDown,
} from "lucide-react";
import { api } from "@/lib/api";

interface RecipeBOM {
  id: string;
  productName: string;
  sku: string;
  sellingPrice: number;
  batchYield: number; // e.g. 50 loaves of bread
  ingredients: { name: string; qty: number; unit: string; cost: number }[];
  batchCost: number;
}

const DEFAULT_BOMS: RecipeBOM[] = [
  {
    id: "BOM-01",
    productName: "Artisan Sourdough Bread (500g)",
    sku: "BAKE-SD-500",
    sellingPrice: 180,
    batchYield: 40,
    batchCost: 2800,
    ingredients: [
      { name: "Unbleached Bread Flour", qty: 20, unit: "kg", cost: 1200 },
      { name: "Sourdough Starter Culture", qty: 4, unit: "kg", cost: 400 },
      { name: "Filtered Water", qty: 15, unit: "L", cost: 150 },
      { name: "Sea Salt", qty: 0.5, unit: "kg", cost: 50 },
      { name: "Oven Electricity & Labor", qty: 1, unit: "batch", cost: 1000 },
    ],
  },
  {
    id: "BOM-02",
    productName: "Butter Croissant (Pack of 4)",
    sku: "BAKE-CR-4",
    sellingPrice: 320,
    batchYield: 60,
    batchCost: 6500,
    ingredients: [
      { name: "French Pastry Flour", qty: 15, unit: "kg", cost: 1800 },
      { name: "Imported Unsalted Butter 82%", qty: 8, unit: "kg", cost: 3600 },
      { name: "Yeast & Milk Powder", qty: 1, unit: "kg", cost: 300 },
      { name: "Baking Energy & Packing", qty: 1, unit: "batch", cost: 800 },
    ],
  },
  {
    id: "BOM-03",
    productName: "Chocolate Fudge Cake (1kg)",
    sku: "BAKE-CAKE-1K",
    sellingPrice: 1200,
    batchYield: 12,
    batchCost: 5400,
    ingredients: [
      { name: "Dark Cocoa Powder 70%", qty: 3, unit: "kg", cost: 1500 },
      { name: "Fresh Dairy Cream", qty: 4, unit: "kg", cost: 1600 },
      { name: "Sugar & Eggs", qty: 5, unit: "kg", cost: 800 },
      { name: "Flour & Vanilla Extract", qty: 3, unit: "kg", cost: 500 },
      { name: "Box & Ribbon Packing", qty: 12, unit: "pcs", cost: 1000 },
    ],
  },
];

export default function ManufacturingPOSPage() {
  const [boms, setBoms] = useState<RecipeBOM[]>(DEFAULT_BOMS);
  const [selectedBom, setSelectedBom] = useState<RecipeBOM>(DEFAULT_BOMS[0]);
  const [batchCount, setBatchCount] = useState(1);
  const [batchNumber, setBatchNumber] = useState(`BATCH-${Date.now().toString().slice(-6)}`);
  const [bakerName, setBakerName] = useState("Master Chef Karim");
  const [destinationWarehouse, setDestinationWarehouse] = useState("Main Bakery Counter");
  const [submitting, setSubmitting] = useState(false);
  const [completedBake, setCompletedBake] = useState<any | null>(null);

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalYieldUnits = selectedBom.batchYield * batchCount;
  const totalProductionCost = selectedBom.batchCost * batchCount;
  const expectedRetailRevenue = totalYieldUnits * selectedBom.sellingPrice;
  const grossMargin = expectedRetailRevenue - totalProductionCost;

  const handleExecuteBakeoff = async () => {
    setSubmitting(true);
    try {
      const payload = {
        bomId: selectedBom.id,
        batchNumber,
        batchCount,
        totalYieldUnits,
        totalProductionCost,
        bakerName,
        destinationWarehouse,
        ingredientsDeducted: selectedBom.ingredients.map((i) => ({
          name: i.name,
          totalQty: i.qty * batchCount,
          unit: i.unit,
          totalCost: i.cost * batchCount,
        })),
        date: new Date().toISOString(),
      };

      setCompletedBake(payload);
    } catch (err) {
      console.error("Manufacturing bake-off execution error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-3 -m-4 sm:-m-6 p-3 sm:p-4 bg-slate-950 text-slate-100 select-none overflow-hidden">
      
      {/* Top Manufacturing Header */}
      <div className="flex-none flex flex-wrap items-center justify-between gap-3 bg-slate-900 rounded-2xl p-3 sm:px-4 border border-amber-900/60 shadow-lg">
        <div className="flex items-center gap-3">
          <Link
            href="/manufacturing"
            className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h1 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <Factory size={16} className="text-amber-400" /> Manufacturing & Bakery Batch Production POS
              </h1>
              <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.2 text-[10px] font-bold uppercase">
                Live BOM Batching
              </span>
            </div>
          </div>
        </div>

        {/* Batch Number tag */}
        <div className="flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
          <span className="text-slate-400">Batch Ref:</span>
          <span className="font-bold text-amber-400">{batchNumber}</span>
        </div>
      </div>

      {/* Main Workspace: Left BOM Recipe Catalogue + Right Production Schedule & Auto-Stock Deduction */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        
        {/* Left 6 Columns: Recipe & Bill of Materials (BOM) Library */}
        <div className="lg:col-span-6 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex-none p-3 border-b border-slate-800">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-amber-400" /> Active Recipes & BOM Catalogue
            </h3>
            <p className="text-[11px] text-slate-400">Select product formulation to trigger batch production</p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
            {boms.map((bom) => {
              const isSelected = selectedBom.id === bom.id;
              return (
                <button
                  key={bom.id}
                  onClick={() => setSelectedBom(bom)}
                  className={`w-full p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-3 shadow-xs ${
                    isSelected
                      ? "bg-slate-900 border-amber-500 ring-2 ring-amber-500/30"
                      : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-400">{bom.sku}</span>
                      <h4 className="font-bold text-white text-sm mt-0.5">{bom.productName}</h4>
                    </div>
                    <span className="rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 text-xs font-black font-mono">
                      Yield: {bom.batchYield} pcs / batch
                    </span>
                  </div>

                  {/* Ingredients breakdown pills */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                    {bom.ingredients.map((ing, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-slate-950 px-2 py-0.5 border border-slate-800 text-slate-300"
                      >
                        {ing.name}: <strong>{ing.qty} {ing.unit}</strong>
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between w-full text-xs">
                    <span className="text-slate-400">
                      Batch Cost: <strong className="text-slate-200">{fmt(bom.batchCost)}</strong>
                    </span>
                    <span className="font-black text-emerald-400">Retail Rate: {fmt(bom.sellingPrice)} / pc</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 6 Columns: Batch Execution & Automated Raw Material Depletion */}
        <div className="lg:col-span-6 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
          <div className="flex-none p-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-white">Production Batch Parameters</h2>
              <span className="text-[10px] text-slate-400">Auto-deducts raw material stock & creates finished goods</span>
            </div>
            <span className="rounded-md bg-amber-500/20 text-amber-400 px-2 py-0.5 text-xs font-bold font-mono">
              {selectedBom.sku}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            
            {/* Batch Multiplier Controls */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white block">Batches to Produce</label>
                <span className="text-[11px] text-slate-400">
                  Total Finished Yield: <strong className="text-amber-400">{totalYieldUnits} units</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBatchCount(Math.max(1, batchCount - 1))}
                  className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:text-white font-bold"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center font-mono font-black text-amber-400 text-lg">{batchCount}</span>
                <button
                  onClick={() => setBatchCount(batchCount + 1)}
                  className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:text-white font-bold"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Automated Raw Material Stock Deductions List */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TrendingDown size={14} className="text-rose-400" /> Automatic Raw Material Depletion
              </span>
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3 space-y-2 text-xs">
                {selectedBom.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-300">{ing.name}</span>
                    <span className="font-mono font-bold text-rose-400">
                      −{(ing.qty * batchCount).toFixed(1)} {ing.unit} ({fmt(ing.cost * batchCount)})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Analysis Grid */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Batch Cost</span>
                <span className="font-black text-rose-400 font-mono text-sm">{fmt(totalProductionCost)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Expected Revenue</span>
                <span className="font-black text-emerald-400 font-mono text-sm">{fmt(expectedRetailRevenue)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Gross Yield Margin</span>
                <span className="font-black text-amber-400 font-mono text-sm">{fmt(grossMargin)}</span>
              </div>
            </div>
          </div>

          {/* Action Execution Footer */}
          <div className="flex-none p-4 bg-slate-950 border-t border-slate-800">
            <button
              onClick={handleExecuteBakeoff}
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/30 hover:from-amber-400 hover:to-orange-400 transition flex items-center justify-center gap-2"
            >
              <Flame size={16} /> Execute Batch Bake-Off & Transfer {totalYieldUnits} Units to Inventory
            </button>
          </div>
        </div>
      </div>

      {/* PRODUCTION BATCH RUN SLIP MODAL */}
      {completedBake && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                Bakery & Production Run Slip
              </span>
              <h3 className="text-lg font-black uppercase mt-1">Batch Completion Certificate</h3>
              <p className="text-xs font-mono text-slate-600">Batch #: {completedBake.batchNumber}</p>
              <p className="text-[10px] text-slate-400">{new Date(completedBake.date).toLocaleString()}</p>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Product Produced:</span>
                <span className="font-bold text-slate-900">{selectedBom.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Finished Yield Units:</span>
                <span className="font-bold text-emerald-700 font-mono">+{completedBake.totalYieldUnits} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination:</span>
                <span className="font-bold text-slate-700">{completedBake.destinationWarehouse}</span>
              </div>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto text-xs">
              <p className="font-bold text-slate-600 text-[11px]">Ingredients Depleted from Raw Stock:</p>
              {completedBake.ingredientsDeducted.map((ing: any, idx: number) => (
                <div key={idx} className="flex justify-between py-0.5 border-b border-slate-50 text-slate-700">
                  <span>{ing.name}</span>
                  <span className="font-mono font-bold text-rose-700">
                    −{ing.totalQty} {ing.unit} ({fmt(ing.totalCost)})
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2 text-xs flex justify-between font-black text-base text-slate-900">
              <span>Total Production Cost:</span>
              <span>{fmt(completedBake.totalProductionCost)}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Printer size={14} /> Print Production Slip
              </button>
              <button
                onClick={() => setCompletedBake(null)}
                className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-700"
              >
                New Batch Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
