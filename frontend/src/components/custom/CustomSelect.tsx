"use client";

import { SelectHTMLAttributes, forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  label: string;
  value: string;
}

export type SelectThemeColor =
  | "primary"
  | "teal"
  | "orange"
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "purple"
  | "blue";

export interface CustomSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
  darkMode?: boolean;
  themeColor?: SelectThemeColor;
}

const THEME_SELECT_STYLES: Record<
  SelectThemeColor,
  { light: string; dark: string; chevron: string; label: string }
> = {
  primary: {
    light: "bg-white border-brand-border text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20",
    chevron: "text-brand-primary",
    label: "text-brand-dark",
  },
  blue: {
    light: "bg-white border-blue-200 text-gray-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20",
    chevron: "text-blue-600",
    label: "text-blue-700",
  },
  teal: {
    light: "bg-white border-slate-200/90 text-gray-600 focus:border-[#00897b] focus:ring-2 focus:ring-[#00897b]/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-brand-border focus:ring-2 focus:ring-teal-400/20",
    chevron: "text-slate-400",
    label: "text-[#00796b]",
  },
  emerald: {
    light: "bg-white border-emerald-200 text-gray-600 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20",
    chevron: "text-emerald-600",
    label: "text-emerald-700",
  },
  orange: {
    light: "bg-white border-orange-200 text-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20",
    chevron: "text-orange-500",
    label: "text-orange-600",
  },
  amber: {
    light: "bg-white border-amber-200 text-gray-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20",
    chevron: "text-amber-500",
    label: "text-amber-600",
  },
  rose: {
    light: "bg-white border-rose-200 text-gray-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20",
    chevron: "text-rose-500",
    label: "text-rose-600",
  },
  purple: {
    light: "bg-white border-purple-200 text-gray-600 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20",
    chevron: "text-purple-600",
    label: "text-purple-700",
  },
  indigo: {
    light: "bg-white border-indigo-200 text-gray-600 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20",
    chevron: "text-indigo-600",
    label: "text-indigo-700",
  },
};

export const CustomSelect = forwardRef<HTMLSelectElement, CustomSelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
      containerClassName,
      className,
      id,
      children,
      darkMode,
      themeColor = "primary",
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const selectId = id ?? autoId;
    const themeStyle = THEME_SELECT_STYLES[themeColor] || THEME_SELECT_STYLES.primary;

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              "mb-1.5 block text-xs font-semibold capitalize",
              darkMode ? "text-slate-300" : themeStyle.label
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full h-9 appearance-none rounded-sm border px-3 pr-9 text-xs sm:text-sm outline-none transition cursor-pointer shadow-2xs",
              darkMode ? themeStyle.dark : themeStyle.light,
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
            className={cn(
              "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2",
              themeStyle.chevron
            )}
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
