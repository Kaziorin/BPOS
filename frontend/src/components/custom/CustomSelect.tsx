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
}

export const CustomSelect = forwardRef<HTMLSelectElement, CustomSelectProps>(
  (
    { label, error, hint, options, placeholder, containerClassName, className, id, children, ...props },
    ref
  ) => {
    const autoId = useId();
    const selectId = id ?? autoId;

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-[15px] font-semibold text-gray-600 capitalize">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-9 text-sm text-gray-900 outline-none transition cursor-pointer",
              "focus:border-primary-500 focus:ring-2 focus:ring-primary-100",
              error ? "border-red-300" : "border-gray-300",
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
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
