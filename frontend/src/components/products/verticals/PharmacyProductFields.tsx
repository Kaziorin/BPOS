"use client";

import React from "react";
import { Pill, Sparkles, Box, Activity } from "lucide-react";
import { CustomCheckbox } from "@/components/custom/CustomCheckbox";

export interface PharmacyFormData {
  genericName: string;
  dosageForm: string;
  speciesType: string;
  manufacturer: string;
  isPrescriptionRequired: boolean;
  hasBatchExpiry: boolean;
  stripsPerBox: string;
  tabletsPerStrip: string;
  storageCondition: string;
  sideEffectsNotes: string;
}

interface Props {
  formData: PharmacyFormData;
  onChange: (field: keyof PharmacyFormData, value: any) => void;
}

const DOSAGE_FORMS = [
  "Tablet",
  "Capsule",
  "Syrup / Suspension",
  "Oral Drop",
  "Injection (IV/IM)",
  "Ointment / Cream",
  "Suppository",
  "Inhaler / Respule",
  "Eye/Ear Drop",
  "IV Fluid / Infusion",
  "Powder / Sachet",
  "Gel / Lotion",
];

const SPECIES_TYPES = [
  { id: "HUMAN", label: "Human Healthcare" },
  { id: "VETERINARY", label: "Veterinary (Livestock & Cattle)" },
  { id: "POULTRY", label: "Poultry Farming" },
  { id: "AQUA", label: "Aquaculture & Fish" },
  { id: "PET", label: "Pet Care (Dogs, Cats, Birds)" },
];

const STORAGE_CONDITIONS = [
  "Room Temperature (Below 25°C)",
  "Cold Storage / Refrigerated (2°C - 8°C)",
  "Deep Freeze (-15°C to -20°C)",
  "Protect from Direct Sunlight & Moisture",
];

export const PharmacyProductFields: React.FC<Props> = ({ formData, onChange }) => {
  const inputClass =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1";

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
        <Pill className="h-4 w-4 text-teal-600" />
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Pharmacy & Medicine Setup Specification
          </h3>
          <p className="text-[11px] text-slate-500 font-normal">
            Generic active ingredient, species classification, dosage form, and box-to-strip conversion ratio.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Generic Name */}
        <div>
          <label className={labelClass}>
            <Sparkles size={13} className="text-teal-600" />
            Generic Name (Active Ingredient) *
          </label>
          <input
            type="text"
            value={formData.genericName || ""}
            onChange={(e) => onChange("genericName", e.target.value)}
            placeholder="e.g. Paracetamol / Amoxicillin / Omeprazole"
            className={inputClass}
          />
          <span className="text-[10px] text-slate-400 mt-1 block">
            Used for generic medicine substitution & search in POS.
          </span>
        </div>

        {/* Dosage Form */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Dosage Form / Preparation *
          </label>
          <select
            value={formData.dosageForm || "Tablet"}
            onChange={(e) => onChange("dosageForm", e.target.value)}
            className={inputClass}
          >
            {DOSAGE_FORMS.map((form) => (
              <option key={form} value={form}>
                {form}
              </option>
            ))}
          </select>
        </div>

        {/* Species / Target Group */}
        <div>
          <label className={labelClass}>
            <Activity size={13} className="text-teal-600" />
            Target Species / Healthcare Category
          </label>
          <select
            value={formData.speciesType || "HUMAN"}
            onChange={(e) => onChange("speciesType", e.target.value)}
            className={inputClass}
          >
            {SPECIES_TYPES.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.label}
              </option>
            ))}
          </select>
        </div>

        {/* Storage Conditions */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Storage Condition
          </label>
          <select
            value={formData.storageCondition || STORAGE_CONDITIONS[0]}
            onChange={(e) => onChange("storageCondition", e.target.value)}
            className={inputClass}
          >
            {STORAGE_CONDITIONS.map((sc) => (
              <option key={sc} value={sc}>
                {sc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Packaging Ratio Box: Box -> Strip -> Tablet */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Box size={14} className="text-teal-600" />
          Unit Conversion & Packaging Ratios (Box vs Strip vs Unit)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">
              Strips per Box
            </label>
            <input
              type="number"
              min="1"
              value={formData.stripsPerBox || "10"}
              onChange={(e) => onChange("stripsPerBox", e.target.value)}
              placeholder="e.g. 10"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">
              Tablets / Units per Strip
            </label>
            <input
              type="number"
              min="1"
              value={formData.tabletsPerStrip || "10"}
              onChange={(e) => onChange("tabletsPerStrip", e.target.value)}
              placeholder="e.g. 10"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Flags & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <CustomCheckbox
            id="isPrescriptionRequired"
            checked={formData.isPrescriptionRequired}
            onChange={(checked) => onChange("isPrescriptionRequired", checked)}
            label="Rx Prescription Required (Doctor's prescription needed at POS)"
          />
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <CustomCheckbox
            id="hasBatchExpiry"
            checked={formData.hasBatchExpiry}
            onChange={(checked) => onChange("hasBatchExpiry", checked)}
            label="Mandatory Batch No & Expiry Tracking (FEFO logic enabled)"
          />
        </div>
      </div>
    </div>
  );
};
