"use client";

import { InputHTMLAttributes, forwardRef, useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CustomCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  containerClassName?: string;
  themeColor?: "primary" | "teal" | "orange" | "indigo" | "emerald" | "amber" | "rose" | "purple" | "blue";
}

const CHECKBOX_THEME_MAP: Record<string, { hover: string; focus: string; checked: string }> = {
  primary: {
    hover: "group-hover:border-primary-500",
    focus: "peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/30 peer-focus-visible:border-primary-500",
    checked: "peer-checked:bg-primary-600 peer-checked:border-primary-600",
  },
  blue: {
    hover: "group-hover:border-blue-500",
    focus: "peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/30 peer-focus-visible:border-blue-500",
    checked: "peer-checked:bg-blue-600 peer-checked:border-blue-600",
  },
  teal: {
    hover: "group-hover:border-teal-500",
    focus: "peer-focus-visible:ring-2 peer-focus-visible:ring-teal-500/30 peer-focus-visible:border-teal-500",
    checked: "peer-checked:bg-teal-600 peer-checked:border-teal-600",
  },
  orange: {
    hover: "group-hover:border-orange-500",
    focus: "peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500/30 peer-focus-visible:border-orange-500",
    checked: "peer-checked:bg-orange-600 peer-checked:border-orange-600",
  },
  emerald: {
    hover: "group-hover:border-emerald-500",
    focus: "peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/30 peer-focus-visible:border-emerald-500",
    checked: "peer-checked:bg-emerald-600 peer-checked:border-emerald-600",
  },
  indigo: {
    hover: "group-hover:border-indigo-500",
    focus: "peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500/30 peer-focus-visible:border-indigo-500",
    checked: "peer-checked:bg-indigo-600 peer-checked:border-indigo-600",
  },
  amber: {
    hover: "group-hover:border-amber-500",
    focus: "peer-focus-visible:ring-2 peer-focus-visible:ring-amber-500/30 peer-focus-visible:border-amber-500",
    checked: "peer-checked:bg-amber-600 peer-checked:border-amber-600",
  },
};

export const CustomCheckbox = forwardRef<HTMLInputElement, CustomCheckboxProps>(
  ({ label, description, checked, disabled, className, containerClassName, themeColor = "teal", onChange, id, ...props }, ref) => {
    const autoId = useId();
    const checkboxId = id ?? autoId;
    const themeStyles = CHECKBOX_THEME_MAP[themeColor] || CHECKBOX_THEME_MAP.teal;
    const isChecked = Boolean(checked);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          "inline-flex items-start gap-2.5 select-none cursor-pointer group",
          disabled && "cursor-not-allowed opacity-60",
          containerClassName
        )}
      >
        <div className="relative flex items-center justify-center mt-0.5 shrink-0">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            checked={isChecked}
            disabled={disabled}
            onChange={(e) => {
              if (onChange) {
                (onChange as any)(e);
              }
            }}
            className="peer sr-only"
            {...props}
          />
          {/* Custom Checkbox Box */}
          <div
            className={cn(
              "h-4 w-4 rounded border border-slate-300 bg-white transition-all shadow-2xs flex items-center justify-center peer-checked:text-white peer-checked:[&>svg]:opacity-100",
              themeStyles.hover,
              themeStyles.focus,
              themeStyles.checked
            )}
          >
            <Check
              className={cn(
                "h-3 w-3 stroke-[3.5] text-white transition-opacity",
                isChecked ? "opacity-100" : "opacity-0"
              )}
            />
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-700 transition">
                {label}
              </span>
            )}
            {description && <span className="text-[11px] text-slate-400">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);

CustomCheckbox.displayName = "CustomCheckbox";
