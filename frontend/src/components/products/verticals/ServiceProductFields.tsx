"use client";

import React from "react";
import { Sparkles, Wrench, Clock, Shield, UserCheck } from "lucide-react";
import { CustomCheckbox } from "@/components/custom/CustomCheckbox";

export interface ServiceFormData {
  durationMinutes: string;
  technicianCommissionPercent: string;
  isAppointmentRequired: boolean;
  warrantyPeriodDays: string;
  requiresSerialNumber: boolean;
  laborChargeOnly: boolean;
  serviceCategoryType: string;
}

interface Props {
  formData: ServiceFormData;
  onChange: (field: keyof ServiceFormData, value: any) => void;
  mode: "SALON" | "REPAIR" | "SERVICE";
}

export const ServiceProductFields: React.FC<Props> = ({ formData, onChange, mode }) => {
  const isRepair = mode === "REPAIR";

  const inputClass =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1";

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
        {isRepair ? <Wrench className="h-4 w-4 text-teal-600" /> : <Sparkles className="h-4 w-4 text-teal-600" />}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            {isRepair ? "Repair & Technical Job Setup" : "Salon & Service Package Specifications"}
          </h3>
          <p className="text-[11px] text-slate-500 font-normal">
            Service duration, technician commission share, warranty terms, and device serial/IMEI tracking.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Service Duration */}
        <div>
          <label className={labelClass}>
            <Clock size={13} className="text-teal-600" />
            Estimated Service Duration (Minutes) *
          </label>
          <input
            type="number"
            min="5"
            step="5"
            value={formData.durationMinutes || "30"}
            onChange={(e) => onChange("durationMinutes", e.target.value)}
            placeholder="e.g. 30, 60, 90"
            className={inputClass}
          />
        </div>

        {/* Technician Commission % */}
        <div>
          <label className={labelClass}>
            <UserCheck size={13} className="text-teal-600" />
            Stylist / Staff Commission Share (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={formData.technicianCommissionPercent || "10"}
            onChange={(e) => onChange("technicianCommissionPercent", e.target.value)}
            placeholder="e.g. 10.00"
            className={inputClass}
          />
        </div>

        {/* Warranty Days */}
        <div>
          <label className={labelClass}>
            <Shield size={13} className="text-teal-600" />
            Service Warranty Period (Days)
          </label>
          <input
            type="number"
            min="0"
            value={formData.warrantyPeriodDays || "30"}
            onChange={(e) => onChange("warrantyPeriodDays", e.target.value)}
            placeholder="e.g. 30, 90, 365"
            className={inputClass}
          />
        </div>
      </div>

      {/* Switches & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {isRepair && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <CustomCheckbox
              id="requiresSerialNumber"
              checked={formData.requiresSerialNumber}
              onChange={(val) => onChange("requiresSerialNumber", typeof val === "boolean" ? val : Boolean((val as any)?.target?.checked))}
              label="Mandatory IMEI / Device Serial Number (Job Ticket Tracking)"
            />
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <CustomCheckbox
            id="isAppointmentRequired"
            checked={formData.isAppointmentRequired}
            onChange={(val) => onChange("isAppointmentRequired", typeof val === "boolean" ? val : Boolean((val as any)?.target?.checked))}
            label="Requires Slot Reservation / Appointment Booking"
          />
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md sm:col-span-2">
          <CustomCheckbox
            id="laborChargeOnly"
            checked={formData.laborChargeOnly}
            onChange={(val) => onChange("laborChargeOnly", typeof val === "boolean" ? val : Boolean((val as any)?.target?.checked))}
            label="Pure Labor / Non-Inventory Service (Zero physical stock tracking)"
          />
        </div>
      </div>
    </div>
  );
};
