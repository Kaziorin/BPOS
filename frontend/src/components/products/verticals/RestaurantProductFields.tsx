"use client";

import React, { useState, useEffect } from "react";
import {
  Utensils,
  Clock,
  Printer,
  Flame,
  Layers,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Share2,
  ShoppingBag,
  Info,
  Scale,
  ChefHat,
  ShieldCheck,
  Tag,
  Calendar,
  Sun,
  Moon,
  Coffee,
} from "lucide-react";
import { CustomCheckbox } from "@/components/custom/CustomCheckbox";
import { api } from "@/lib/api";

export interface RestaurantAddon {
  id: string;
  name: string;
  price: string;
  isAvailable?: boolean;
}

export interface RestaurantModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelection: number;
  maxSelection: number;
  options: { name: string; extraPrice: string }[];
}

export interface RestaurantRelatedProduct {
  id: string;
  name: string;
  price?: string;
  category?: string;
}

export interface RestaurantRecipeItem {
  id: string;
  ingredientName: string;
  quantity: string;
  unit: string;
  unitCost: string;
}

export interface RestaurantPortionSize {
  id: string;
  name: string;
  price: string;
  isDefault: boolean;
  isEnabled: boolean;
  isCustom?: boolean;
}

export interface RestaurantFormData {
  isKitchenProduct?: boolean;
  timeSlotIds?: string[];
  allTimeSlots?: boolean;
  prepTimeMinutes: string;
  kitchenStation: string;
  dineInTaxRate: string;
  takeawayTaxRate: string;
  hasRecipeBom: boolean;
  isVegetarian: boolean;
  isHalal: boolean;
  isChefSpecial: boolean;
  isGlutenFree: boolean;
  spiceLevel: string;
  dineInAvailable: boolean;
  takeawayAvailable: boolean;
  deliveryAvailable: boolean;
  portionSizes?: RestaurantPortionSize[];
  addons: RestaurantAddon[];
  modifierGroups: RestaurantModifierGroup[];
  relatedProducts: RestaurantRelatedProduct[];
  recipeBom: RestaurantRecipeItem[];
}

interface Props {
  formData: RestaurantFormData;
  onChange: (field: keyof RestaurantFormData, value: any) => void;
}

const KITCHEN_STATIONS = [
  "Main Kitchen KDS",
  "Grill & Fryer Station",
  "Bar & Beverage KDS",
  "Bakery & Dessert Section",
  "Pizza Oven & Italian Station",
  "Sushi & Cold Prep Counter",
  "Coffee & Espresso Bar",
];

const SPICE_LEVELS = [
  "None / Mild",
  "Medium Spicy",
  "Hot Spicy 🔥",
  "Extra Hot / Ghost Pepper 🌶️🔥",
];

export const DEFAULT_PORTION_SIZES: RestaurantPortionSize[] = [
  { id: "small", name: "Small", price: "", isDefault: false, isEnabled: false },
  { id: "regular", name: "Regular", price: "", isDefault: true, isEnabled: false },
  { id: "large", name: "Large", price: "", isDefault: false, isEnabled: false },
  { id: "xlarge", name: "Extra Large", price: "", isDefault: false, isEnabled: false },
];

export const RestaurantProductFields: React.FC<Props> = ({ formData, onChange }) => {
  const [activeTab, setActiveTab] = useState<"KITCHEN" | "SIZES" | "ADDONS" | "RELATED" | "RECIPE">("KITCHEN");
  const [timeSlots, setTimeSlots] = useState<any[]>([]);

  // Custom portion size input state
  const [newCustomSizeName, setNewCustomSizeName] = useState("");
  const [newCustomSizePrice, setNewCustomSizePrice] = useState("");

  useEffect(() => {
    async function fetchSlots() {
      try {
        const res: any = await api.get("/v1/restaurant/time-slots");
        const sData = res?.data?.slots || res?.slots || res?.data || [];
        if (Array.isArray(sData)) {
          setTimeSlots(sData);
        }
      } catch (e) {
        console.warn("Failed to fetch time slots:", e);
      }
    }
    fetchSlots();
  }, []);

  // Portion Size Handlers
  const portionSizes = formData.portionSizes && formData.portionSizes.length > 0 ? formData.portionSizes : DEFAULT_PORTION_SIZES;

  const handleTogglePortionSizeEnabled = (id: string) => {
    const current = formData.portionSizes && formData.portionSizes.length > 0 ? formData.portionSizes : DEFAULT_PORTION_SIZES;
    const updated = current.map((s) => {
      if (s.id === id) {
        return { ...s, isEnabled: !s.isEnabled };
      }
      return s;
    });

    const enabledList = updated.filter((s) => s.isEnabled);
    if (enabledList.length > 0 && !enabledList.some((s) => s.isDefault)) {
      enabledList[0].isDefault = true;
    }

    onChange("portionSizes", updated);
  };

  const handleUpdatePortionSizePrice = (id: string, price: string) => {
    const current = formData.portionSizes && formData.portionSizes.length > 0 ? formData.portionSizes : DEFAULT_PORTION_SIZES;
    const updated = current.map((s) => (s.id === id ? { ...s, price } : s));
    onChange("portionSizes", updated);
  };

  const handleSetDefaultPortionSize = (id: string) => {
    const current = formData.portionSizes && formData.portionSizes.length > 0 ? formData.portionSizes : DEFAULT_PORTION_SIZES;
    const updated = current.map((s) => ({
      ...s,
      isDefault: s.id === id,
    }));
    onChange("portionSizes", updated);
  };

  const handleAddCustomSize = () => {
    if (!newCustomSizeName.trim()) return;
    const current = formData.portionSizes && formData.portionSizes.length > 0 ? formData.portionSizes : DEFAULT_PORTION_SIZES;
    const newSize: RestaurantPortionSize = {
      id: `custom-size-${Date.now()}`,
      name: newCustomSizeName.trim(),
      price: newCustomSizePrice || "",
      isDefault: false,
      isEnabled: true,
      isCustom: true,
    };
    onChange("portionSizes", [...current, newSize]);
    setNewCustomSizeName("");
    setNewCustomSizePrice("");
  };

  const handleRemovePortionSize = (id: string) => {
    const current = formData.portionSizes || [];
    onChange("portionSizes", current.filter((s) => s.id !== id));
  };

  // New Add-on State
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");

  // New Related Product State
  const [newRelatedName, setNewRelatedName] = useState("");
  const [newRelatedPrice, setNewRelatedPrice] = useState("");
  const [newRelatedCat, setNewRelatedCat] = useState("Sides & Drinks");

  // New Recipe Ingredient State
  const [newIngName, setNewIngName] = useState("");
  const [newIngQty, setNewIngQty] = useState("");
  const [newIngUnit, setNewIngUnit] = useState("pcs");
  const [newIngCost, setNewIngCost] = useState("");

  const inputClass =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1";

  // ADDON Handlers
  const handleAddAddon = () => {
    if (!newAddonName.trim()) return;
    const currentAddons = formData.addons || [];
    const updated = [
      ...currentAddons,
      {
        id: Date.now().toString(),
        name: newAddonName.trim(),
        price: newAddonPrice || "0",
        isAvailable: true,
      },
    ];
    onChange("addons", updated);
    setNewAddonName("");
    setNewAddonPrice("");
  };

  const handleRemoveAddon = (id: string) => {
    const currentAddons = formData.addons || [];
    onChange(
      "addons",
      currentAddons.filter((a) => a.id !== id)
    );
  };

  const handleToggleAddonAvailable = (id: string) => {
    const currentAddons = formData.addons || [];
    onChange(
      "addons",
      currentAddons.map((a) => (a.id === id ? { ...a, isAvailable: !a.isAvailable } : a))
    );
  };

  // RELATED PRODUCTS Handlers
  const handleAddRelated = () => {
    if (!newRelatedName.trim()) return;
    const current = formData.relatedProducts || [];
    const updated = [
      ...current,
      {
        id: Date.now().toString(),
        name: newRelatedName.trim(),
        price: newRelatedPrice || "0",
        category: newRelatedCat || "Sides",
      },
    ];
    onChange("relatedProducts", updated);
    setNewRelatedName("");
    setNewRelatedPrice("");
  };

  const handleRemoveRelated = (id: string) => {
    const current = formData.relatedProducts || [];
    onChange(
      "relatedProducts",
      current.filter((r) => r.id !== id)
    );
  };

  // RECIPE BOM Handlers
  const handleAddRecipeIngredient = () => {
    if (!newIngName.trim() || !newIngQty.trim()) return;
    const current = formData.recipeBom || [];
    const updated = [
      ...current,
      {
        id: Date.now().toString(),
        ingredientName: newIngName.trim(),
        quantity: newIngQty.trim(),
        unit: newIngUnit.trim(),
        unitCost: newIngCost.trim() || "0",
      },
    ];
    onChange("recipeBom", updated);
    setNewIngName("");
    setNewIngQty("");
    setNewIngCost("");
  };

  const handleRemoveRecipeIngredient = (id: string) => {
    const current = formData.recipeBom || [];
    onChange(
      "recipeBom",
      current.filter((item) => item.id !== id)
    );
  };

  const totalRecipeCost = (formData.recipeBom || []).reduce((sum, item) => {
    const q = parseFloat(item.quantity) || 0;
    const c = parseFloat(item.unitCost) || 0;
    return sum + q * c;
  }, 0);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              Restaurant & Food Operations
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-100 text-teal-700 font-semibold uppercase">
                Food Menu Setup
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-normal">
              Configure Kitchen Routing, Add-ons / Modifiers, Upsell Suggestions, and Recipe BOM.
            </p>
          </div>
        </div>

        {/* Modular Navigation Tabs */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-md border border-slate-200 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("KITCHEN")}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1 ${
              activeTab === "KITCHEN"
                ? "bg-white text-teal-700 shadow-2xs font-bold"
                : "text-slate-600 hover:text-gray-900"
            }`}
          >
            <Printer size={13} />
            Kitchen & Station
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("SIZES")}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1 ${
              activeTab === "SIZES"
                ? "bg-white text-teal-700 shadow-2xs font-bold"
                : "text-slate-600 hover:text-gray-900"
            }`}
          >
            <Scale size={13} />
            Portion Sizes & Prices
            {portionSizes.filter((s) => s.isEnabled).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-teal-600 text-white text-[10px]">
                {portionSizes.filter((s) => s.isEnabled).length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ADDONS")}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1 ${
              activeTab === "ADDONS"
                ? "bg-white text-teal-700 shadow-2xs font-bold"
                : "text-slate-600 hover:text-gray-900"
            }`}
          >
            <Sparkles size={13} />
            Add-ons / Modifiers
            {(formData.addons || []).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-teal-600 text-white text-[10px]">
                {(formData.addons || []).length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("RELATED")}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1 ${
              activeTab === "RELATED"
                ? "bg-white text-teal-700 shadow-2xs font-bold"
                : "text-slate-600 hover:text-gray-900"
            }`}
          >
            <Share2 size={13} />
            Related / Upsell
            {(formData.relatedProducts || []).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-teal-600 text-white text-[10px]">
                {(formData.relatedProducts || []).length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("RECIPE")}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1 ${
              activeTab === "RECIPE"
                ? "bg-white text-teal-700 shadow-2xs font-bold"
                : "text-slate-600 hover:text-gray-900"
            }`}
          >
            <Layers size={13} />
            Recipe BOM
            {(formData.recipeBom || []).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-teal-600 text-white text-[10px]">
                {(formData.recipeBom || []).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: Kitchen & Operations */}
      {activeTab === "KITCHEN" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          {/* Kitchen / KOT Item Checkbox Card */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              (formData.isKitchenProduct ?? true)
                ? "bg-teal-50/60 border-teal-200"
                : "bg-amber-50/70 border-amber-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <CustomCheckbox
                  id="isKitchenProduct"
                  checked={formData.isKitchenProduct ?? true}
                  onChange={(e: any) =>
                    onChange("isKitchenProduct", e?.target ? e.target.checked : e)
                  }
                  label="🍳 Is Kitchen / KOT Product (Send to Kitchen)"
                />
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  (formData.isKitchenProduct ?? true)
                    ? "bg-teal-100 text-teal-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {(formData.isKitchenProduct ?? true)
                  ? "✓ Sends to Kitchen (KOT)"
                  : "⚡ Ready Product (No KOT)"}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-2 ml-6 leading-relaxed">
              {(formData.isKitchenProduct ?? true)
                ? "When ordered at POS, this item will automatically generate a Kitchen Order Ticket (KOT) on the chef's KDS station for preparation."
                : "Ready-to-serve item (e.g. canned drinks, packaged chips, bottled water, ice cream). Placing an order will NOT send this item to the kitchen KOT."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Kitchen Routing Station */}
            <div>
              <label className={labelClass}>
                <Printer size={13} className="text-teal-600" />
                Kitchen Station / KDS Display *
              </label>
              <select
                value={formData.kitchenStation || KITCHEN_STATIONS[0]}
                onChange={(e) => onChange("kitchenStation", e.target.value)}
                className={inputClass}
              >
                {KITCHEN_STATIONS.map((station) => (
                  <option key={station} value={station}>
                    {station}
                  </option>
                ))}
              </select>
            </div>

            {/* Preparation Time */}
            <div>
              <label className={labelClass}>
                <Clock size={13} className="text-teal-600" />
                Prep Time (Minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.prepTimeMinutes || "15"}
                onChange={(e) => onChange("prepTimeMinutes", e.target.value)}
                placeholder="e.g. 15"
                className={inputClass}
              />
            </div>

            {/* Spice Level */}
            <div>
              <label className={labelClass}>
                <Flame size={13} className="text-teal-600" />
                Default Spice Level
              </label>
              <select
                value={formData.spiceLevel || SPICE_LEVELS[0]}
                onChange={(e) => onChange("spiceLevel", e.target.value)}
                className={inputClass}
              >
                {SPICE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Meal Shifts & Time Slots Availability */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wide">
                <Clock size={13} className="text-teal-600" />
                Meal Shifts &amp; Time Slots (Menu Availability)
              </div>
              <div className="flex items-center gap-2">
                <CustomCheckbox
                  id="allTimeSlots"
                  checked={formData.allTimeSlots ?? ((formData.timeSlotIds || []).length === 0)}
                  onChange={(e: any) => {
                    const isAll = e?.target ? e.target.checked : e;
                    onChange("allTimeSlots", isAll);
                    if (isAll) {
                      onChange("timeSlotIds", []);
                    }
                  }}
                  label="Available in All Shifts (24/7)"
                />
              </div>
            </div>

            {!(formData.allTimeSlots ?? ((formData.timeSlotIds || []).length === 0)) && (
              <div className="space-y-2 pt-1 border-t border-slate-200 animate-fadeIn">
                <p className="text-[11px] text-slate-500">
                  Select which specific meal shifts this food item will be visible and orderable at the POS counter:
                </p>
                {timeSlots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {timeSlots.map((slot) => {
                      const selectedIds: string[] = formData.timeSlotIds || [];
                      const isSelected = selectedIds.includes(slot.id);

                      const toggleSlot = () => {
                        if (isSelected) {
                          const next = selectedIds.filter((id) => id !== slot.id);
                          onChange("timeSlotIds", next);
                        } else {
                          onChange("timeSlotIds", [...selectedIds, slot.id]);
                        }
                      };

                      return (
                        <div
                          key={slot.id}
                          onClick={toggleSlot}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex items-center justify-between gap-2 ${
                            isSelected
                              ? "bg-teal-50 border-teal-300 shadow-2xs"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-800 block truncate">
                              {slot.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono font-medium">
                              🕒 {slot.startTime} – {slot.endTime}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={toggleSlot}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 pointer-events-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                    <span>No custom shifts created yet. Create shifts from the Restaurant Hub.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dining Channels & Order Availability */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-md space-y-2">
            <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wide">
              <ShoppingBag size={13} className="text-teal-600" />
              Order Channel Availability
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 bg-white border border-slate-200 rounded-md">
                <CustomCheckbox
                  id="dineInAvailable"
                  checked={formData.dineInAvailable ?? true}
                  onChange={(e: any) => onChange("dineInAvailable", e?.target ? e.target.checked : e)}
                  label="Available for Dine-in"
                />
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-md">
                <CustomCheckbox
                  id="takeawayAvailable"
                  checked={formData.takeawayAvailable ?? true}
                  onChange={(e: any) => onChange("takeawayAvailable", e?.target ? e.target.checked : e)}
                  label="Available for Takeaway / Parcel"
                />
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-md">
                <CustomCheckbox
                  id="deliveryAvailable"
                  checked={formData.deliveryAvailable ?? true}
                  onChange={(e: any) => onChange("deliveryAvailable", e?.target ? e.target.checked : e)}
                  label="Available for Online Delivery"
                />
              </div>
            </div>
          </div>

          {/* Dietary & Menu Badges */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-md space-y-2">
            <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wide">
              <ShieldCheck size={13} className="text-teal-600" />
              Dietary Tags & Menu Badges (Visible on POS & Receipts)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="p-2.5 bg-white border border-slate-200 rounded-md">
                <CustomCheckbox
                  id="isVegetarian"
                  checked={formData.isVegetarian}
                  onChange={(e: any) => onChange("isVegetarian", e?.target ? e.target.checked : e)}
                  label="🌱 100% Vegetarian (Veg)"
                />
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-md">
                <CustomCheckbox
                  id="isHalal"
                  checked={formData.isHalal ?? true}
                  onChange={(e: any) => onChange("isHalal", e?.target ? e.target.checked : e)}
                  label="✨ 100% Halal Certified"
                />
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-md">
                <CustomCheckbox
                  id="isChefSpecial"
                  checked={formData.isChefSpecial}
                  onChange={(e: any) => onChange("isChefSpecial", e?.target ? e.target.checked : e)}
                  label="👨‍🍳 Chef's Special / Signature"
                />
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-md">
                <CustomCheckbox
                  id="isGlutenFree"
                  checked={formData.isGlutenFree}
                  onChange={(e: any) => onChange("isGlutenFree", e?.target ? e.target.checked : e)}
                  label="🌾 Gluten-Free Dish"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Portion Sizes & Variations */}
      {activeTab === "SIZES" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div className="bg-teal-50/60 border border-teal-200 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale size={14} className="text-teal-600" />
                  Portion Sizes & Custom Prices (Small, Regular, Large, Extra Large)
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Check which portion sizes are available for this dish and set their individual prices. Select one size as default (e.g. Small or Regular). If no size is checked, the dish will sell at the default Base Selling Price.
                </p>
              </div>
            </div>
          </div>

          {/* Portion Size List */}
          <div className="space-y-2.5">
            {portionSizes.map((size) => {
              return (
                <div
                  key={size.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border transition ${
                    size.isEnabled
                      ? "bg-teal-50/50 border-teal-200 shadow-2xs"
                      : "bg-slate-50/60 border-slate-200 text-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={size.isEnabled}
                      onChange={() => handleTogglePortionSizeEnabled(size.id)}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 accent-teal-600 cursor-pointer"
                    />
                    <span className={`text-xs font-bold ${size.isEnabled ? "text-gray-800" : "text-gray-400"}`}>
                      {size.name}
                    </span>
                    {size.isDefault && size.isEnabled && (
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider">
                        Default Size
                      </span>
                    )}
                  </div>

                  {size.isEnabled ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-500">Price (৳):</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={size.price}
                          onChange={(e) => handleUpdatePortionSizePrice(size.id, e.target.value)}
                          placeholder="0.00"
                          className="w-32 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-800 focus:border-teal-500 focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSetDefaultPortionSize(size.id)}
                        className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                          size.isDefault
                            ? "bg-teal-600 text-white shadow-2xs"
                            : "bg-white border border-slate-200 text-gray-600 hover:bg-slate-100"
                        }`}
                      >
                        {size.isDefault ? "✓ Default" : "Set Default"}
                      </button>

                      {size.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleRemovePortionSize(size.id)}
                          className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 transition"
                          title="Remove custom size"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Check box to enable size & price</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Custom Portion Size */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-lg space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
              Add Custom Portion Size (e.g. Medium, 1/2 Portion, Family Pack)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Size Name (e.g. Medium / 1 Litre / Family Pack)"
                value={newCustomSizeName}
                onChange={(e) => setNewCustomSizeName(e.target.value)}
                className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-teal-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Price (৳)"
                value={newCustomSizePrice}
                onChange={(e) => setNewCustomSizePrice(e.target.value)}
                className="w-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-teal-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomSize}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition cursor-pointer shrink-0"
              >
                <Plus size={14} /> Add Size
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Add-ons & Modifiers Setup */}
      {activeTab === "ADDONS" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-md flex items-start gap-2">
            <Info size={16} className="text-teal-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-teal-800">
              <span className="font-bold">Add-on Products & Extras:</span> Customers can customize this dish at POS by adding extra toppings, side dips, extra cheese, or portion upgrades with specific extra pricing.
            </div>
          </div>

          {/* Add Add-on Form */}
          <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3 space-y-2">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              + Add New Extra Add-on / Modifier
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  placeholder="e.g. Extra Cheese Slice / Garlic Mayo Sauce / Extra Beef Patty"
                  value={newAddonName}
                  onChange={(e) => setNewAddonName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-4 relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Extra Price (৳ e.g. 30.00)"
                  value={newAddonPrice}
                  onChange={(e) => setNewAddonPrice(e.target.value)}
                  className={`${inputClass} pr-8`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">৳</span>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddAddon}
                  className="w-full h-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-medium">Quick Suggestions:</span>
              {[
                { name: "Extra Cheese", price: "30" },
                { name: "Garlic Mayo Dip", price: "20" },
                { name: "Extra Patty", price: "80" },
                { name: "Spicy Dip Sauce", price: "15" },
                { name: "Large Fries Upgrade", price: "50" },
                { name: "Extra Shot Espresso", price: "30" },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNewAddonName(item.name);
                    setNewAddonPrice(item.price);
                  }}
                  className="text-[10px] bg-white border border-slate-200 hover:border-teal-400 px-2 py-0.5 rounded text-slate-700 transition cursor-pointer"
                >
                  + {item.name} (৳{item.price})
                </button>
              ))}
            </div>
          </div>

          {/* Active Add-ons List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center justify-between">
              <span>Configured Add-ons ({(formData.addons || []).length})</span>
            </div>

            {(!formData.addons || formData.addons.length === 0) ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-md bg-slate-50/50">
                <Sparkles className="mx-auto h-6 w-6 text-slate-300 mb-1" />
                <p className="text-xs font-semibold text-slate-500">No add-ons added yet</p>
                <p className="text-[11px] text-slate-400">Use the form above to add extra toppings or options.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {formData.addons.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between p-2.5 rounded-md border border-slate-200 bg-white hover:border-teal-300 transition shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-teal-50 text-teal-700">
                        <Sparkles size={13} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-800">{addon.name}</div>
                        <div className="text-[11px] font-semibold text-teal-600">
                          +৳{parseFloat(addon.price || "0").toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAddonAvailable(addon.id)}
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold cursor-pointer ${
                          addon.isAvailable !== false
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {addon.isAvailable !== false ? "Active" : "Disabled"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAddon(addon.id)}
                        className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Remove Add-on"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Related / Upsell Products */}
      {activeTab === "RELATED" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-md flex items-start gap-2">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-800">
              <span className="font-bold">Cross-Sell & Upsell Suggestions:</span> When a cashier adds this product to cart at POS, the system will prompt suggestions (e.g. &quot;Would you like French Fries or a Soft Drink with this?&quot;).
            </div>
          </div>

          {/* Add Related Item Form */}
          <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3 space-y-2">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              + Link Suggested / Related Product
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="e.g. French Fries / Coca-Cola / Chocolate Lava Cake"
                  value={newRelatedName}
                  onChange={(e) => setNewRelatedName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Category (e.g. Beverage / Sides)"
                  value={newRelatedCat}
                  onChange={(e) => setNewRelatedCat(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2 relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price ৳"
                  value={newRelatedPrice}
                  onChange={(e) => setNewRelatedPrice(e.target.value)}
                  className={`${inputClass} pr-6`}
                />
                <span className="absolute right-2 top-2.5 text-xs text-slate-400 font-bold">৳</span>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddRelated}
                  className="w-full h-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition"
                >
                  <Plus size={14} /> Link
                </button>
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-medium">Popular Pairings:</span>
              {[
                { name: "French Fries", price: "90", cat: "Sides" },
                { name: "Cold Coca-Cola / Sprite", price: "40", cat: "Beverages" },
                { name: "Garlic Bread (4 pcs)", price: "120", cat: "Sides" },
                { name: "Chocolate Ice Cream", price: "80", cat: "Desserts" },
                { name: "Mineral Water (500ml)", price: "20", cat: "Beverages" },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNewRelatedName(item.name);
                    setNewRelatedPrice(item.price);
                    setNewRelatedCat(item.cat);
                  }}
                  className="text-[10px] bg-white border border-slate-200 hover:border-teal-400 px-2 py-0.5 rounded text-slate-700 transition cursor-pointer"
                >
                  + {item.name} (৳{item.price})
                </button>
              ))}
            </div>
          </div>

          {/* Active Related Items */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Linked Upsell Items ({(formData.relatedProducts || []).length})
            </div>

            {(!formData.relatedProducts || formData.relatedProducts.length === 0) ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-md bg-slate-50/50">
                <Share2 className="mx-auto h-6 w-6 text-slate-300 mb-1" />
                <p className="text-xs font-semibold text-slate-500">No related products linked yet</p>
                <p className="text-[11px] text-slate-400">Add complementary side dishes, drinks, or desserts to boost sales.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {formData.relatedProducts.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-md border border-slate-200 bg-white shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-amber-50 text-amber-700">
                        <Tag size={13} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-800">{item.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.category || "Sides"} • <span className="text-teal-600 font-semibold">৳{item.price || "0"}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRelated(item.id)}
                      className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Recipe & BOM (Bill of Materials) */}
      {activeTab === "RECIPE" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Layers size={14} className="text-teal-600" />
                Automated Kitchen Recipe BOM Deduction
              </div>
              <CustomCheckbox
                id="hasRecipeBom"
                checked={formData.hasRecipeBom}
                onChange={(e: any) => onChange("hasRecipeBom", e?.target ? e.target.checked : e)}
                label="Enable Automatic Raw Material Stock Deduction on POS Sale"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              When this dish is ordered at POS or online, the kitchen inventory will automatically deduct the specified raw ingredients (e.g. Flour, Meat, Cheese, Oil).
            </p>
          </div>

          {formData.hasRecipeBom && (
            <div className="space-y-3">
              {/* Add Ingredient Row */}
              <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  + Add Recipe Raw Ingredient
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Ingredient Name (e.g. Chicken Patty, Burger Bun, Mozzarella Cheese)"
                      value={newIngName}
                      onChange={(e) => setNewIngName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Qty (e.g. 1 / 0.25 / 100)"
                      value={newIngQty}
                      onChange={(e) => setNewIngQty(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={newIngUnit}
                      onChange={(e) => setNewIngUnit(e.target.value)}
                      className={inputClass}
                    >
                      <option value="pcs">Pcs / Item</option>
                      <option value="gm">Gram (gm)</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="ml">Milliliter (ml)</option>
                      <option value="liter">Liter (L)</option>
                      <option value="slice">Slice</option>
                      <option value="tbsp">Tablespoon (tbsp)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 relative">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Unit Cost ৳"
                      value={newIngCost}
                      onChange={(e) => setNewIngCost(e.target.value)}
                      className={`${inputClass} pr-6`}
                    />
                    <span className="absolute right-2 top-2.5 text-xs text-slate-400 font-bold">৳</span>
                  </div>
                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddRecipeIngredient}
                      className="w-full h-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold flex items-center justify-center cursor-pointer transition"
                      title="Add Ingredient"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recipe Table */}
              {(!formData.recipeBom || formData.recipeBom.length === 0) ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-md bg-slate-50/50">
                  <ChefHat className="mx-auto h-6 w-6 text-slate-300 mb-1" />
                  <p className="text-xs font-semibold text-slate-500">No ingredients linked yet</p>
                  <p className="text-[11px] text-slate-400">Add the ingredients required to prepare 1 serving of this dish.</p>
                </div>
              ) : (
                <div className="rounded-md border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2">Ingredient</th>
                        <th className="px-3 py-2 text-center">Required Qty</th>
                        <th className="px-3 py-2 text-center">Unit</th>
                        <th className="px-3 py-2 text-right">Unit Cost</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                        <th className="px-3 py-2 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.recipeBom.map((item) => {
                        const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-bold text-gray-800">{item.ingredientName}</td>
                            <td className="px-3 py-2 text-center font-mono font-semibold text-teal-700">{item.quantity}</td>
                            <td className="px-3 py-2 text-center text-slate-500 capitalize">{item.unit}</td>
                            <td className="px-3 py-2 text-right text-slate-600">৳{parseFloat(item.unitCost || "0").toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-bold text-gray-800">৳{subtotal.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRecipeIngredient(item.id)}
                                className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-teal-50/50 border-t border-teal-100">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 font-bold text-teal-800 text-right uppercase text-[11px]">
                          Estimated Recipe Raw Food Cost (per Serving):
                        </td>
                        <td className="px-3 py-2 font-bold text-teal-800 text-right text-xs">
                          ৳{totalRecipeCost.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
