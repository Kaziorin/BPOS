"use client";

import React from "react";
import { Building2, Key, Percent } from "lucide-react";
import { CustomCheckbox } from "@/components/custom/CustomCheckbox";

export interface FranchiseFormData {
  masterCatalogSku: string;
  royaltyRatePercent: string;
  allowBranchPriceOverride: boolean;
  isCentralRestricted: boolean;
}

interface Props {
  formData: FranchiseFormData;
  onChange: (field: keyof FranchiseFormData, value: any) => void;
}

export const FranchiseProductFields: React.FC<Props> = ({ formData, onChange }) => {
  const inputClass =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1";

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
        <Building2 className="h-4 w-4 text-teal-600" />
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Franchise & Multi-Outlet Master Control
          </h3>
          <p className="text-[11px] text-slate-500 font-normal">
            Master SKU catalog mapping, royalty rate calculations, and store price locks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Master Catalog SKU */}
        <div>
          <label className={labelClass}>
            <Key size={13} className="text-teal-600" />
            Central Master Catalog SKU *
          </label>
          <input
            type="text"
            value={formData.masterCatalogSku || ""}
            onChange={(e) => onChange("masterCatalogSku", e.target.value)}
            placeholder="e.g. F-MASTER-8820"
            className={`${inputClass} font-mono`}
          />
        </div>

        {/* Royalty Rate % */}
        <div>
          <label className={labelClass}>
            <Percent size={13} className="text-teal-600" />
            Franchise Royalty Share (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.royaltyRatePercent || "5.0"}
            onChange={(e) => onChange("royaltyRatePercent", e.target.value)}
            placeholder="e.g. 5.0%"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <CustomCheckbox
            id="allowBranchPriceOverride"
            checked={formData.allowBranchPriceOverride}
            onChange={(checked) => onChange("allowBranchPriceOverride", checked)}
            label="Allow Outlet Managers to Override POS Selling Price"
          />
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <CustomCheckbox
            id="isCentralRestricted"
            checked={formData.isCentralRestricted}
            onChange={(checked) => onChange("isCentralRestricted", checked)}
            label="Strict Central Purchasing Only (Outlet cannot locally order)"
          />
        </div>
      </div>
    </div>
  );
};
