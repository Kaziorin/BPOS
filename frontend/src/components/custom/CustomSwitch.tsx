"use client";

import { forwardRef, ReactNode, useId } from "react";
import { cn } from "@/lib/cn";

export interface CustomSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: ReactNode;
  description?: string;
  size?: "sm" | "md" | "lg";
  themeColor?: "teal" | "primary" | "emerald" | "amber" | "rose" | "indigo" | "purple" | "blue";
  className?: string;
  containerClassName?: string;
  id?: string;
}

const SWITCH_THEME_MAP: Record<string, { activeBg: string; focusRing: string }> = {
  teal: {
    activeBg: "bg-[#00897b]",
    focusRing: "focus-visible:ring-[#00897b]/30",
  },
  primary: {
    activeBg: "bg-[#0284c7]",
    focusRing: "focus-visible:ring-[#0284c7]/30",
  },
  blue: {
    activeBg: "bg-[#0284c7]",
    focusRing: "focus-visible:ring-[#0284c7]/30",
  },
  emerald: {
    activeBg: "bg-emerald-600",
    focusRing: "focus-visible:ring-emerald-500/30",
  },
  rose: {
    activeBg: "bg-rose-600",
    focusRing: "focus-visible:ring-rose-500/30",
  },
  amber: {
    activeBg: "bg-amber-600",
    focusRing: "focus-visible:ring-amber-500/30",
  },
  purple: {
    activeBg: "bg-purple-600",
    focusRing: "focus-visible:ring-purple-500/30",
  },
};

const SIZES = {
  sm: {
    track: "w-8 h-4.5 p-0.5",
    knob: "w-3.5 h-3.5",
    translate: "translate-x-3.5",
  },
  md: {
    track: "w-11 h-6 p-0.5",
    knob: "w-5 h-5",
    translate: "translate-x-5",
  },
  lg: {
    track: "w-14 h-7.5 p-1",
    knob: "w-5.5 h-5.5",
    translate: "translate-x-6.5",
  },
};

export const CustomSwitch = forwardRef<HTMLButtonElement, CustomSwitchProps>(
  (
    {
      checked,
      onChange,
      disabled = false,
      label,
      description,
      size = "md",
      themeColor = "teal",
      className,
      containerClassName,
      id,
    },
    ref
  ) => {
    const autoId = useId();
    const switchId = id ?? autoId;
    const theme = SWITCH_THEME_MAP[themeColor] || SWITCH_THEME_MAP.teal;
    const sizeConfig = SIZES[size] || SIZES.md;

    return (
      <label
        htmlFor={switchId}
        className={cn(
          "inline-flex items-center gap-3 select-none cursor-pointer group",
          disabled && "cursor-not-allowed opacity-50 pointer-events-none",
          containerClassName
        )}
      >
        <button
          ref={ref}
          id={switchId}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={cn(
            "relative inline-flex shrink-0 rounded-full transition-colors duration-200 ease-in-out cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2",
            sizeConfig.track,
            checked ? theme.activeBg : "bg-slate-300 hover:bg-slate-400/80",
            theme.focusRing,
            className
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none inline-block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
              sizeConfig.knob,
              checked ? sizeConfig.translate : "translate-x-0"
            )}
          />
        </button>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-slate-500">{description}</span>
            )}
          </div>
        )}
      </label>
    );
  }
);

CustomSwitch.displayName = "CustomSwitch";

// Alias for convenience
export const CustomToggle = CustomSwitch;
