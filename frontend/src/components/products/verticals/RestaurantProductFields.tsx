"use client";

import React from "react";
import { Utensils, Clock, Printer, Flame, Layers } from "lucide-react";
import { CustomCheckbox } from "@/components/custom/CustomCheckbox";

export interface RestaurantFormData {
  prepTimeMinutes: string;
  kitchenStation: string;
  dineInTaxRate: string;
  takeawayTaxRate: string;
  hasRecipeBom: boolean;
  modifierGroups: string[];
  isVegetarian: boolean;
  spiceLevel: string;
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
  "Sushi & Cold Prep Counter",
];

const SPICE_LEVELS = [
  "None / Mild",
  "Medium Spicy",
  "Hot Spicy 🔥",
  "Extra Hot / Ghost Pepper 🌶️🔥",
];

export const RestaurantProductFields: React.FC<Props> = ({ formData, onChange }) => {
  const inputClass =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1";

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
        <Utensils className="h-4 w-4 text-teal-600" />
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Restaurant & Kitchen Operations Setup
          </h3>
          <p className="text-[11px] text-slate-500 font-normal">
            KDS station routing, preparation time estimate, recipe ingredients, and spice levels.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Kitchen Routing Station */}
        <div>
          <label className={labelClass}>
            <Printer size={13} className="text-teal-600" />
            Kitchen Printer / KDS Station *
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

        {/* Prep Time */}
        <div>
          <label className={labelClass}>
            <Clock size={13} className="text-teal-600" />
            Preparation Time (Minutes)
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

        {/* Vegetarian Option */}
        <div className="flex items-end pb-0.5">
          <div className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md">
            <CustomCheckbox
              id="isVegetarian"
              checked={formData.isVegetarian}
              onChange={(checked) => onChange("isVegetarian", checked)}
              label="100% Vegetarian / Green Leaf (Veg Icon on POS & Receipt)"
            />
          </div>
        </div>
      </div>

      {/* Recipe / BOM Integration Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Layers size={14} className="text-teal-600" />
          Recipe BOM Inventory Deduction
        </div>
        <p className="text-[11px] text-slate-500">
          When this item is sold at POS, automatically deduct raw ingredients (flour, meat, oil, spices) from kitchen stock.
        </p>

        <div className="p-2.5 bg-white border border-slate-200 rounded-md">
          <CustomCheckbox
            id="hasRecipeBom"
            checked={formData.hasRecipeBom}
            onChange={(checked) => onChange("hasRecipeBom", checked)}
            label="Link Raw Material Ingredients (Bill of Materials Costing)"
          />
        </div>
      </div>
    </div>
  );
};
