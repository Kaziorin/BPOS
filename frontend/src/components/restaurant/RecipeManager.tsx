"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Utensils,
  Plus,
  Trash2,
  Save,
  DollarSign,
  PieChart,
  Percent,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  costPrice: number;
  unit?: string;
}

interface IngredientItem {
  ingredientProductId: string;
  name?: string;
  qtyRequired: number;
  unit: string;
  unitCost: number;
}

interface FoodCostResult {
  productId: string;
  productName: string;
  sellingPrice: number;
  totalFoodCost: number;
  grossMargin: number;
  grossMarginPct: number;
}

export default function RecipeManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [foodCostData, setFoodCostData] = useState<FoodCostResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load products list
  useEffect(() => {
    api.get<{ data: Product[] }>("/v1/products?limit=100").then((res) => {
      setProducts(res.data || []);
    });
  }, []);

  // Fetch recipe when product selected
  useEffect(() => {
    if (!selectedProductId) {
      setIngredients([]);
      setFoodCostData(null);
      return;
    }
    loadRecipeData(selectedProductId);
  }, [selectedProductId]);

  const loadRecipeData = async (pid: string) => {
    setLoading(true);
    try {
      const [resRecipe, resCost] = await Promise.all([
        api.get<{ data: any[] }>(`/v1/restaurant/recipes?recipeProductId=${pid}`),
        api.get<{ data: FoodCostResult }>(`/v1/restaurant/recipes/${pid}/food-cost`),
      ]);

      if (resRecipe.data && resRecipe.data.length > 0) {
        setIngredients(
          resRecipe.data.map((r: any) => ({
            ingredientProductId: r.ingredientProductId,
            name: r.ingredientProductName,
            qtyRequired: r.qtyRequired,
            unit: r.unit || "unit",
            unitCost: r.unitCost || r.currentIngredientCost || 0,
          }))
        );
      } else {
        setIngredients([]);
      }

      setFoodCostData(resCost.data || null);
    } catch (err) {
      console.error("Recipe load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = () => {
    const defaultIng = products[0];
    if (!defaultIng) return;
    setIngredients((prev) => [
      ...prev,
      {
        ingredientProductId: defaultIng.id,
        name: defaultIng.name,
        qtyRequired: 1,
        unit: defaultIng.unit || "gm",
        unitCost: defaultIng.costPrice || 0,
      },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (
    index: number,
    field: keyof IngredientItem,
    value: any
  ) => {
    setIngredients((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === "ingredientProductId") {
          const matched = products.find((p) => p.id === value);
          return {
            ...item,
            ingredientProductId: value,
            name: matched?.name,
            unitCost: matched?.costPrice || 0,
          };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleSaveRecipe = async () => {
    if (!selectedProductId) return;
    setSaving(true);
    try {
      await api.post("/v1/restaurant/recipes", {
        recipeProductId: selectedProductId,
        ingredients: ingredients.map((i) => ({
          ingredientProductId: i.ingredientProductId,
          qtyRequired: Number(i.qtyRequired),
          unit: i.unit,
          unitCost: Number(i.unitCost),
        })),
      });
      alert("Recipe BOM saved successfully!");
      loadRecipeData(selectedProductId);
    } catch (err: any) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Live Food Cost Estimate
  const selectedProductObj = products.find((p) => p.id === selectedProductId);
  const livePrice = selectedProductObj?.sellingPrice || 0;
  const liveTotalCost = ingredients.reduce(
    (sum, i) => sum + Number(i.qtyRequired) * Number(i.unitCost),
    0
  );
  const liveMargin = livePrice - liveTotalCost;
  const liveMarginPct = livePrice > 0 ? (liveMargin / livePrice) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Product Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Utensils className="w-5 h-5 text-indigo-400" />
          <label className="text-sm font-bold text-white whitespace-nowrap">
            Select Dish / Recipe Product:
          </label>
          <select
            id="select-recipe-product"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 w-full md:w-80 focus:outline-none focus:border-indigo-500"
          >
            <option value="">-- Choose a Product --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (৳{p.sellingPrice})
              </option>
            ))}
          </select>
        </div>

        {selectedProductId && (
          <div className="flex items-center gap-3">
            <button
              id="btn-add-ingredient"
              onClick={handleAddIngredient}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Add Ingredient
            </button>
            <button
              id="btn-save-recipe"
              onClick={handleSaveRecipe}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Recipe BOM"}
            </button>
          </div>
        )}
      </div>

      {selectedProductId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ingredients List Form */}
          <div className="lg:col-span-2 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Bill of Materials (BOM Ingredients)
            </h3>

            <div className="space-y-3">
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800"
                >
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                      Raw Ingredient
                    </label>
                    <select
                      id={`select-ing-prod-${idx}`}
                      value={ing.ingredientProductId}
                      onChange={(e) =>
                        handleIngredientChange(idx, "ingredientProductId", e.target.value)
                      }
                      className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                      Qty Required
                    </label>
                    <input
                      id={`input-ing-qty-${idx}`}
                      type="number"
                      step="0.01"
                      min="0.001"
                      value={ing.qtyRequired}
                      onChange={(e) =>
                        handleIngredientChange(idx, "qtyRequired", Number(e.target.value))
                      }
                      className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2"
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                      Unit
                    </label>
                    <input
                      id={`input-ing-unit-${idx}`}
                      type="text"
                      placeholder="e.g. gm / ml"
                      value={ing.unit}
                      onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2"
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                      Unit Cost (৳)
                    </label>
                    <input
                      id={`input-ing-cost-${idx}`}
                      type="number"
                      step="0.01"
                      value={ing.unitCost}
                      onChange={(e) =>
                        handleIngredientChange(idx, "unitCost", Number(e.target.value))
                      }
                      className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      id={`btn-remove-ing-${idx}`}
                      onClick={() => handleRemoveIngredient(idx)}
                      className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {ingredients.length === 0 && (
                <div className="text-center p-8 bg-slate-900 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                  No ingredients added yet. Click &quot;Add Ingredient&quot; above to specify raw materials.
                </div>
              )}
            </div>
          </div>

          {/* Food Cost & Profit Analytics Summary */}
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-400" /> Food Cost Analytics
            </h3>

            <div className="space-y-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Dish Selling Price</span>
                <span className="text-lg font-bold text-white">৳{livePrice.toFixed(2)}</span>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Est. Total Food Cost</span>
                <span className="text-lg font-bold text-rose-400">৳{liveTotalCost.toFixed(2)}</span>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Gross Margin (৳)</span>
                <span className="text-lg font-bold text-emerald-400">৳{liveMargin.toFixed(2)}</span>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Gross Margin %</span>
                <span
                  className={`text-sm font-extrabold px-3 py-1 rounded-full border ${
                    liveMarginPct >= 60
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : liveMarginPct >= 40
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                  }`}
                >
                  {liveMarginPct.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Automated Inventory Deduction
              </p>
              <p className="text-[11px] text-indigo-200/80">
                When this recipe item is sold at POS, the raw ingredient quantities listed above will be deducted automatically from inventory.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-center">
          <Utensils className="w-12 h-12 mb-3 text-slate-600" />
          <p className="font-semibold text-slate-400">Select a dish to manage recipe</p>
          <p className="text-xs mt-1">Choose a product from the dropdown above to create its Bill of Materials.</p>
        </div>
      )}
    </div>
  );
}
