"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { SearchableSelect, CustomButton } from "@/components/custom";
import { toast } from "react-toastify";
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
  unit?: any;
}

interface IngredientItem {
  ingredientProductId: string;
  name?: string;
  qtyRequired: number;
  unit: any;
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

const getUnitName = (u: any): string => {
  if (!u) return "unit";
  if (typeof u === "string") return u;
  if (typeof u === "object") {
    return u.name || u.shortName || u.title || u.unitName || "unit";
  }
  return String(u);
};

const RESTAURANT_DEMO_PRODUCTS: Product[] = [
  { id: "res-prod-1", name: "Grilled Chicken Steak", sellingPrice: 450, costPrice: 180, unit: "plate" },
  { id: "res-prod-2", name: "Beef Cheese Burger", sellingPrice: 320, costPrice: 130, unit: "pcs" },
  { id: "res-prod-3", name: "Pasta Alfredo Creamy", sellingPrice: 380, costPrice: 140, unit: "bowl" },
  { id: "res-prod-4", name: "Garlic Butter Naan", sellingPrice: 60, costPrice: 15, unit: "pcs" },
  { id: "res-prod-5", name: "Cold Coffee Brewed", sellingPrice: 180, costPrice: 50, unit: "glass" },
  { id: "res-prod-6", name: "French Fries Crispy", sellingPrice: 120, costPrice: 35, unit: "portion" },
  { id: "res-prod-7", name: "Raw Chicken Breast", sellingPrice: 0, costPrice: 280, unit: "kg" },
  { id: "res-prod-8", name: "Mozzarella Cheese", sellingPrice: 0, costPrice: 650, unit: "kg" },
  { id: "res-prod-9", name: "Cooking Olive Oil", sellingPrice: 0, costPrice: 850, unit: "liter" },
];

export default function RecipeManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [foodCostData, setFoodCostData] = useState<FoodCostResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load products list (Enforce Tenant & RESTAURANT Service Isolation)
  useEffect(() => {
    api
      .get<{ data: any[] }>("/v1/products?productType=RESTAURANT&limit=100")
      .then((res) => {
        const apiProds = res.data || [];
        // Strictly filter to ensure ONLY RESTAURANT items are loaded
        const filtered = apiProds.filter(
          (p: any) =>
            p.vertical === "RESTAURANT" ||
            p.vertical === "restaurant" ||
            p.productType === "RESTAURANT" ||
            p.type === "RESTAURANT"
        );
        if (filtered.length > 0) {
          setProducts(filtered);
        } else {
          // If no RESTAURANT products exist for this tenant, show strictly RESTAURANT demo items
          setProducts(RESTAURANT_DEMO_PRODUCTS);
        }
      })
      .catch(() => {
        setProducts(RESTAURANT_DEMO_PRODUCTS);
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
      if (pid.startsWith("res-prod-")) {
        // Handle demo/fallback product without hitting DB endpoint which returns 404
        setIngredients([
          { ingredientProductId: "res-prod-7", name: "Raw Chicken Breast", qtyRequired: 0.25, unit: "kg", unitCost: 280 },
          { ingredientProductId: "res-prod-8", name: "Mozzarella Cheese", qtyRequired: 0.05, unit: "kg", unitCost: 650 },
          { ingredientProductId: "res-prod-9", name: "Cooking Olive Oil", qtyRequired: 0.02, unit: "liter", unitCost: 850 },
        ]);
        setFoodCostData(null);
        setLoading(false);
        return;
      }

      const [resRecipe, resCost] = await Promise.all([
        api.get<{ data: any[] }>(`/v1/restaurant/recipes?recipeProductId=${pid}`).catch(() => ({ data: [] })),
        api.get<{ data: FoodCostResult }>(`/v1/restaurant/recipes/${pid}/food-cost`).catch(() => ({ data: null })),
      ]);

      if (resRecipe.data && resRecipe.data.length > 0) {
        setIngredients(
          resRecipe.data.map((r: any) => ({
            ingredientProductId: r.ingredientProductId,
            name: r.ingredientProductName,
            qtyRequired: r.qtyRequired,
            unit: getUnitName(r.unit),
            unitCost: r.unitCost || r.currentIngredientCost || 0,
          }))
        );
      } else {
        setIngredients([]);
      }

      setFoodCostData(resCost.data || null);
    } catch (err) {
      console.error("Recipe load error:", err);
      setIngredients([]);
      setFoodCostData(null);
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
        unit: getUnitName(defaultIng.unit),
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
            unit: getUnitName(matched?.unit),
            unitCost: matched?.costPrice || 0,
          };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleSaveRecipe = async () => {
    if (!selectedProductId) return;
    if (selectedProductId.startsWith("res-prod-")) {
      toast.info("Recipe BOM configuration preview updated! (To save permanently to database, please create a product under Product Catalog).");
      return;
    }
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
      toast.success("Recipe BOM saved successfully!");
      loadRecipeData(selectedProductId);
    } catch (err: any) {
      toast.error("Save failed: " + (err.response?.data?.detail || err.message));
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
      {/* Product Selector Bar (Full Width, Compact rounded-md, SearchableSelect, CustomButton) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-md border border-slate-200 shadow-2xs w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-orange-600 shrink-0" />
            <label className="text-xs font-bold text-gray-600 whitespace-nowrap">
              Select Dish / Recipe Product:
            </label>
          </div>
          <div className="w-full md:w-80">
            <SearchableSelect
              options={products.map((p) => ({
                value: p.id,
                label: p.name,
                sublabel: `৳${p.sellingPrice} per ${getUnitName(p.unit)}`,
              }))}
              value={selectedProductId}
              onChange={(val) => setSelectedProductId(val)}
              placeholder="-- Choose a Product --"
              searchPlaceholder="Search recipe product..."
              themeColor="orange"
            />
          </div>
        </div>

        {selectedProductId && (
          <div className="flex items-center gap-2.5">
            <CustomButton
              id="btn-add-ingredient"
              onClick={handleAddIngredient}
              variant="outline"
              size="sm"
              themeColor="orange"
              leftIcon={<Plus className="w-3.5 h-3.5 text-orange-600" />}
              className="border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 hover:border-orange-300"
            >
              Add Ingredient
            </CustomButton>
            <CustomButton
              id="btn-save-recipe"
              onClick={handleSaveRecipe}
              variant="primary"
              size="sm"
              themeColor="orange"
              loading={saving}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              {saving ? "Saving..." : "Save Recipe BOM"}
            </CustomButton>
          </div>
        )}
      </div>

      {selectedProductId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Ingredients List Form (Compact rounded-md border-slate-200) */}
          <div className="lg:col-span-2 bg-white p-5 rounded-md border border-slate-200 shadow-2xs space-y-4 w-full">
            <h3 className="text-sm font-bold text-gray-600 flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-600" /> Bill of Materials (BOM Ingredients)
            </h3>

            <div className="space-y-3 w-full">
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-md border border-slate-200 w-full"
                >
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                      Raw Ingredient
                    </label>
                    <SearchableSelect
                      options={products.map((p) => ({
                        value: p.id,
                        label: p.name,
                        sublabel: `${getUnitName(p.unit)} (Cost: ৳${p.costPrice})`,
                      }))}
                      value={ing.ingredientProductId}
                      onChange={(val) =>
                        handleIngredientChange(idx, "ingredientProductId", val)
                      }
                      placeholder="Select ingredient..."
                      searchPlaceholder="Search raw ingredient..."
                      themeColor="orange"
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
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
                      className="w-full bg-white border border-slate-200 text-gray-900 text-xs rounded-md p-2 focus:border-orange-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                      Unit
                    </label>
                    <input
                      id={`input-ing-unit-${idx}`}
                      type="text"
                      placeholder="e.g. gm / ml"
                      value={getUnitName(ing.unit)}
                      onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                      className="w-full bg-white border border-slate-200 text-gray-900 text-xs rounded-md p-2 focus:border-orange-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
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
                      className="w-full bg-white border border-slate-200 text-gray-900 text-xs rounded-md p-2 focus:border-orange-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      id={`btn-remove-ing-${idx}`}
                      onClick={() => handleRemoveIngredient(idx)}
                      className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                      title="Remove Ingredient"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {ingredients.length === 0 && (
                <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-md text-gray-500 text-xs w-full">
                  No ingredients added yet. Click &quot;Add Ingredient&quot; above to specify raw materials.
                </div>
              )}
            </div>
          </div>

          {/* Food Cost & Profit Analytics Summary (Compact rounded-md border-slate-200) */}
          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-2xs space-y-5 w-full">
            <h3 className="text-sm font-bold text-gray-600 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-orange-600" /> Food Cost Analytics
            </h3>

            <div className="space-y-3.5 w-full">
              <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-gray-600 font-bold">Dish Selling Price</span>
                <span className="text-base font-bold text-gray-600">৳{livePrice.toFixed(2)}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-gray-600 font-bold">Est. Total Food Cost</span>
                <span className="text-base font-bold text-rose-600">৳{liveTotalCost.toFixed(2)}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-gray-600 font-bold">Gross Margin (৳)</span>
                <span className="text-base font-bold text-emerald-600">৳{liveMargin.toFixed(2)}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-gray-600 font-bold">Gross Margin %</span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    liveMarginPct >= 60
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : liveMarginPct >= 40
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {liveMarginPct.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-md text-xs text-orange-800 space-y-1 w-full">
              <p className="font-bold flex items-center gap-1.5 text-orange-900">
                <CheckCircle2 className="w-4 h-4 text-orange-600" /> Automated Inventory Deduction
              </p>
              <p className="text-[11px] text-orange-700 leading-relaxed">
                When this dish is ordered at Restaurant POS, raw ingredient stock will automatically decrease based on this BOM recipe.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-14 bg-white border border-dashed border-slate-200 rounded-md text-gray-500 text-center shadow-2xs w-full">
          <Utensils className="w-9 h-9 mb-2.5 text-slate-400" />
          <p className="font-bold text-gray-600">Select a dish to manage recipe</p>
          <p className="text-xs text-gray-500 mt-1">Choose a product from the dropdown above to create its Bill of Materials.</p>
        </div>
      )}
    </div>
  );
}
