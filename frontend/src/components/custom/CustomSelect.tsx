"use client";

import { SelectHTMLAttributes, forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  label: string;
  value: string;
}

export interface CustomSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
  darkMode?: boolean;
}

export const CustomSelect = forwardRef<HTMLSelectElement, CustomSelectProps>(
  (
    { label, error, hint, options, placeholder, containerClassName, className, id, children, darkMode, ...props },
    ref
  ) => {
    const autoId = useId();
    const selectId = id ?? autoId;

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label htmlFor={selectId} className={cn(
            "mb-1.5 block text-xs font-semibold capitalize",
            darkMode ? "text-slate-300" : "text-[#0369A1]"
          )}>
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none rounded-sm border px-3 py-2 pr-9 text-sm outline-none transition cursor-pointer shadow-2xs",
              darkMode
                ? "bg-slate-800 border-slate-700 text-slate-100 focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]/20"
                : "bg-white border-sky-200/90 text-gray-600 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20",
              error ? "border-red-300" : "",
              className
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options?.map((opt, idx) => (
              <option key={`${opt.value}-${idx}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>
          <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#0284C7]"
          />
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-red-600">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
        ) : null}
      </div>
    );
  }
);

CustomSelect.displayName = "CustomSelect";
