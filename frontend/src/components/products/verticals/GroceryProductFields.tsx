"use client";

import React from "react";
import { ShoppingCart, Scale, MapPin, AlertTriangle, Barcode } from "lucide-react";
import { CustomCheckbox } from "@/components/custom/CustomCheckbox";

export interface GroceryFormData {
  pluCode: string;
  isWeightedScaleItem: boolean;
  pricePerUnitBasis: string;
  shelfLocation: string;
  expiryWarningDays: string;
  isLooseItem: boolean;
}

interface Props {
  formData: GroceryFormData;
  onChange: (field: keyof GroceryFormData, value: any) => void;
}

const UNIT_BASES = [
  "Per Kilogram (Kg)",
  "Per Gram (g)",
  "Per Liter (L)",
  "Per Piece / Pack (Pc)",
  "Per Dozen (Dzn)",
];

export const GroceryProductFields: React.FC<Props> = ({ formData, onChange }) => {
  const inputClass =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1";

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
        <ShoppingCart className="h-4 w-4 text-teal-600" />
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Grocery & Supermarket POS Setup
          </h3>
          <p className="text-[11px] text-slate-500 font-normal">
            Digital weighing scale barcode PLU codes, loose item unpack ratio, and shelf location.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Weighing Scale PLU Code */}
        <div>
          <label className={labelClass}>
            <Barcode size={13} className="text-teal-600" />
            Weighing Scale PLU / Prefix Code
          </label>
          <input
            type="text"
            value={formData.pluCode || ""}
            onChange={(e) => onChange("pluCode", e.target.value)}
            placeholder="e.g. 210045"
            className={`${inputClass} font-mono`}
          />
          <span className="text-[10px] text-slate-400 mt-1 block">
            Used to parse weight automatically from 13-digit scale barcodes at POS checkout.
          </span>
        </div>

        {/* Price Basis */}
        <div>
          <label className={labelClass}>
            <Scale size={13} className="text-teal-600" />
            Price Unit Rate Basis *
          </label>
          <select
            value={formData.pricePerUnitBasis || UNIT_BASES[0]}
            onChange={(e) => onChange("pricePerUnitBasis", e.target.value)}
            className={inputClass}
          >
            {UNIT_BASES.map((ub) => (
              <option key={ub} value={ub}>
                {ub}
              </option>
            ))}
          </select>
        </div>

        {/* Shelf / Aisle Location */}
        <div>
          <label className={labelClass}>
            <MapPin size={13} className="text-teal-600" />
            Rack / Shelf / Aisle Location
          </label>
          <input
            type="text"
            value={formData.shelfLocation || ""}
            onChange={(e) => onChange("shelfLocation", e.target.value)}
            placeholder="e.g. Aisle 3 - Shelf B2"
            className={inputClass}
          />
        </div>

        {/* Expiry Alert Lead Days */}
        <div>
          <label className={labelClass}>
            <AlertTriangle size={13} className="text-teal-600" />
            Expiry Alert Lead Days
          </label>
          <input
            type="number"
            min="1"
            value={formData.expiryWarningDays || "15"}
            onChange={(e) => onChange("expiryWarningDays", e.target.value)}
            placeholder="e.g. 15 days before expiry"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <CustomCheckbox
            id="isWeightedScaleItem"
            checked={formData.isWeightedScaleItem}
            onChange={(e: any) => onChange("isWeightedScaleItem", e?.target ? e.target.checked : e)}
            label="Weighing Scale Integration (Auto-detect quantity from weight scanner)"
          />
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <CustomCheckbox
            id="isLooseItem"
            checked={formData.isLooseItem}
            onChange={(e: any) => onChange("isLooseItem", e?.target ? e.target.checked : e)}
            label="Loose / Bulk Item (Allows partial decimal quantities, e.g. 1.250 Kg)"
          />
        </div>
      </div>
    </div>
  );
};
