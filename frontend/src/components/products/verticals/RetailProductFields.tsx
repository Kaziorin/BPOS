"use client";

import React from "react";
import { ShoppingBag, Tag } from "lucide-react";
import { CustomCheckbox } from "@/components/custom/CustomCheckbox";

export interface RetailFormData {
  seasonCollection: string;
  targetGender: string;
  hasVariantMatrix: boolean;
  warrantyPeriodMonths: string;
  isReturnable: boolean;
}

interface Props {
  formData: RetailFormData;
  onChange: (field: keyof RetailFormData, value: any) => void;
}

const SEASONS = ["All Season", "Summer 2026", "Winter / Festive", "Spring Collection", "Autumn"];
const GENDERS = ["Unisex", "Men", "Women", "Kids / Boys", "Kids / Girls", "Babies"];

export const RetailProductFields: React.FC<Props> = ({ formData, onChange }) => {
  const inputClass =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1";

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
        <ShoppingBag className="h-4 w-4 text-teal-600" />
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Retail & Lifestyle Product Setup
          </h3>
          <p className="text-[11px] text-slate-500 font-normal">
            Variants matrix (Size/Color), barcode symbology, and season catalog tags.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Season */}
        <div>
          <label className={labelClass}>
            <Tag size={13} className="text-teal-600" />
            Season / Collection Tag
          </label>
          <select
            value={formData.seasonCollection || SEASONS[0]}
            onChange={(e) => onChange("seasonCollection", e.target.value)}
            className={inputClass}
          >
            {SEASONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Gender / Target */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Target Demographic
          </label>
          <select
            value={formData.targetGender || GENDERS[0]}
            onChange={(e) => onChange("targetGender", e.target.value)}
            className={inputClass}
          >
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <CustomCheckbox
            id="hasVariantMatrix"
            checked={formData.hasVariantMatrix}
            onChange={(e: any) => onChange("hasVariantMatrix", e?.target ? e.target.checked : e)}
            label="Enable Variant Matrix (Size, Color, Material grid SKU generation)"
          />
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <CustomCheckbox
            id="isReturnable"
            checked={formData.isReturnable}
            onChange={(e: any) => onChange("isReturnable", e?.target ? e.target.checked : e)}
            label="Customer Returnable & Exchangeable (With receipt tag)"
          />
        </div>
      </div>
    </div>
  );
};
