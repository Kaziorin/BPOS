"use client";

import { InputHTMLAttributes, forwardRef, useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CustomCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  containerClassName?: string;
}

export const CustomCheckbox = forwardRef<HTMLInputElement, CustomCheckboxProps>(
  ({ label, description, checked, disabled, className, containerClassName, onChange, id, ...props }, ref) => {
    const autoId = useId();
    const checkboxId = id ?? autoId;

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
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          {/* Custom Checkbox Box with Teal Accent */}
          <div
            className={cn(
              "h-4 w-4 rounded-xs border border-slate-300 bg-white transition-all shadow-2xs flex items-center justify-center",
              "group-hover:border-teal-500",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-teal-500/30 peer-focus-visible:border-teal-500",
              "peer-checked:bg-teal-600 peer-checked:border-teal-600 peer-checked:text-white peer-checked:[&>svg]:opacity-100"
            )}
          >
            <Check
              className={cn(
                "h-3 w-3 stroke-[3.5] text-white transition-opacity",
                checked ? "opacity-100" : "opacity-0"
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
