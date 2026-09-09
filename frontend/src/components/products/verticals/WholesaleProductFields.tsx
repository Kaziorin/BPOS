"use client";

import React from "react";
import { Truck, DollarSign, PackageCheck, Layers } from "lucide-react";
import { CustomCheckbox } from "@/components/custom/CustomCheckbox";

export interface WholesaleTier {
  minQty: string;
  maxQty: string;
  unitPrice: string;
}

export interface WholesaleFormData {
  moq: string;
  unitsPerCarton: string;
  isCreditEligible: boolean;
  priceTiers: WholesaleTier[];
}

interface Props {
  formData: WholesaleFormData;
  onChange: (field: keyof WholesaleFormData, value: any) => void;
}

export const WholesaleProductFields: React.FC<Props> = ({ formData, onChange }) => {
  const inputClass =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1";

  const tiers = formData.priceTiers || [
    { minQty: "1", maxQty: "10", unitPrice: "" },
    { minQty: "11", maxQty: "50", unitPrice: "" },
    { minQty: "51", maxQty: "100+", unitPrice: "" },
  ];

  const handleTierChange = (index: number, key: keyof WholesaleTier, val: string) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [key]: val };
    onChange("priceTiers", updated);
  };

  const addTier = () => {
    const lastMax = parseInt(tiers[tiers.length - 1]?.maxQty || "0", 10);
    const newMin = (lastMax + 1).toString();
    onChange("priceTiers", [...tiers, { minQty: newMin, maxQty: (lastMax + 50).toString(), unitPrice: "" }]);
  };

  const removeTier = (index: number) => {
    if (tiers.length <= 1) return;
    onChange("priceTiers", tiers.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
        <Truck className="h-4 w-4 text-teal-600" />
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Wholesale & B2B Distribution Setup
          </h3>
          <p className="text-[11px] text-slate-500 font-normal">
            Minimum order quantity (MOQ), master carton packing ratio, and bulk volume price tiers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* MOQ */}
        <div>
          <label className={labelClass}>
            <PackageCheck size={13} className="text-teal-600" />
            Minimum Order Quantity (MOQ) *
          </label>
          <input
            type="number"
            min="1"
            value={formData.moq || "1"}
            onChange={(e) => onChange("moq", e.target.value)}
            placeholder="e.g. 10 Pcs"
            className={inputClass}
          />
        </div>

        {/* Master Carton Units */}
        <div>
          <label className={labelClass}>
            <Layers size={13} className="text-teal-600" />
            Master Carton / Case Packing Unit
          </label>
          <input
            type="number"
            min="1"
            value={formData.unitsPerCarton || "24"}
            onChange={(e) => onChange("unitsPerCarton", e.target.value)}
            placeholder="e.g. 24 Pcs per Carton"
            className={inputClass}
          />
        </div>
      </div>

      {/* Bulk Quantity Price Tiers Table */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <DollarSign size={14} className="text-teal-600" />
            Volume Price Break Tiers
          </div>
          <button
            type="button"
            onClick={addTier}
            className="text-xs text-teal-600 hover:text-teal-700 font-semibold underline cursor-pointer"
          >
            + Add Pricing Tier
          </button>
        </div>

        <div className="space-y-2">
          {tiers.map((tier, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono w-16">Tier {idx + 1}:</span>
              <input
                type="number"
                placeholder="Min Qty"
                value={tier.minQty}
                onChange={(e) => handleTierChange(idx, "minQty", e.target.value)}
                className="w-24 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-gray-700"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="text"
                placeholder="Max Qty"
                value={tier.maxQty}
                onChange={(e) => handleTierChange(idx, "maxQty", e.target.value)}
                className="w-24 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-gray-700"
              />
              <span className="text-xs text-slate-400">=</span>
              <input
                type="number"
                placeholder="Custom Price (৳)"
                value={tier.unitPrice}
                onChange={(e) => handleTierChange(idx, "unitPrice", e.target.value)}
                className="w-32 rounded border border-teal-300 bg-white px-2.5 py-1 text-xs text-teal-700 font-bold"
              />
              {tiers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTier(idx)}
                  className="text-xs text-red-500 hover:text-red-700 px-1 font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
        <CustomCheckbox
          id="isCreditEligible"
          checked={formData.isCreditEligible}
          onChange={(e: any) => onChange("isCreditEligible", e?.target ? e.target.checked : e)}
          label="Eligible for B2B Wholesale Credit Account Billing (Post-paid ledger)"
        />
      </div>
    </div>
  );
};
