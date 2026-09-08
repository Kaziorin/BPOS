"use client";

import React from "react";
import { Factory, Cpu, Layers, DollarSign } from "lucide-react";

export interface ManufacturingFormData {
  itemRole: string; // RAW_MATERIAL | WIP | FINISHED_GOOD
  yieldFactorPercent: string;
  standardLaborCost: string;
  overheadCost: string;
}

interface Props {
  formData: ManufacturingFormData;
  onChange: (field: keyof ManufacturingFormData, value: any) => void;
}

const ITEM_ROLES = [
  { id: "FINISHED_GOOD", label: "Finished Assembly Good (Ready for Sale)" },
  { id: "RAW_MATERIAL", label: "Raw Material Ingredient (Used in Assembly)" },
  { id: "WIP", label: "Work In Progress / Sub-Assembly" },
];

export const ManufacturingProductFields: React.FC<Props> = ({ formData, onChange }) => {
  const inputClass =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1";

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
        <Factory className="h-4 w-4 text-teal-600" />
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Manufacturing & Production Setup
          </h3>
          <p className="text-[11px] text-slate-500 font-normal">
            Role designation (Raw vs Finished), production yield ratio, and labor overhead costing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Item Role */}
        <div>
          <label className={labelClass}>
            <Cpu size={13} className="text-teal-600" />
            Manufacturing Inventory Role *
          </label>
          <select
            value={formData.itemRole || "FINISHED_GOOD"}
            onChange={(e) => onChange("itemRole", e.target.value)}
            className={inputClass}
          >
            {ITEM_ROLES.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {/* Yield Factor % */}
        <div>
          <label className={labelClass}>
            <Layers size={13} className="text-teal-600" />
            Expected Production Yield (%)
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={formData.yieldFactorPercent || "100"}
            onChange={(e) => onChange("yieldFactorPercent", e.target.value)}
            placeholder="e.g. 98.5%"
            className={inputClass}
          />
        </div>

        {/* Labor Cost */}
        <div>
          <label className={labelClass}>
            <DollarSign size={13} className="text-teal-600" />
            Standard Assembly Labor Cost per Unit
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={formData.standardLaborCost || "0"}
            onChange={(e) => onChange("standardLaborCost", e.target.value)}
            placeholder="e.g. 15.00"
            className={inputClass}
          />
        </div>

        {/* Overhead Cost */}
        <div>
          <label className={labelClass}>
            <DollarSign size={13} className="text-teal-600" />
            Factory Overhead Cost per Unit
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={formData.overheadCost || "0"}
            onChange={(e) => onChange("overheadCost", e.target.value)}
            placeholder="e.g. 5.00"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
};
