"use client";

import { InputHTMLAttributes, ReactNode, forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

export type InputThemeColor =
  | "primary"
  | "teal"
  | "orange"
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "purple"
  | "blue";

export interface CustomInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  error?: string;
  hint?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
  darkMode?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  themeColor?: InputThemeColor;
}

const ROUNDED_CLASSES: Record<string, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

const THEME_INPUT_STYLES: Record<
  InputThemeColor,
  { light: string; dark: string; icon: string; label: string }
> = {
  primary: {
    light: "bg-white border-brand-border text-slate-800 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20",
    icon: "text-brand-primary",
    label: "text-brand-dark",
  },
  blue: {
    light: "bg-white border-blue-200 text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20",
    icon: "text-blue-600",
    label: "text-blue-700",
  },
  teal: {
    light: "bg-white border-slate-200/90 text-slate-800 placeholder:text-slate-400 focus:border-[#00897b] focus:ring-2 focus:ring-[#00897b]/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20",
    icon: "text-slate-400",
    label: "text-[#00796b]",
  },
  emerald: {
    light: "bg-white border-emerald-200 text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20",
    icon: "text-emerald-600",
    label: "text-emerald-700",
  },
  orange: {
    light: "bg-white border-orange-200 text-slate-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20",
    icon: "text-orange-500",
    label: "text-orange-600",
  },
  amber: {
    light: "bg-white border-amber-200 text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20",
    icon: "text-amber-500",
    label: "text-amber-600",
  },
  rose: {
    light: "bg-white border-rose-200 text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20",
    icon: "text-rose-500",
    label: "text-rose-600",
  },
  purple: {
    light: "bg-white border-purple-200 text-slate-800 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20",
    icon: "text-purple-600",
    label: "text-purple-700",
  },
  indigo: {
    light: "bg-white border-indigo-200 text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20",
    dark: "bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20",
    icon: "text-indigo-600",
    label: "text-indigo-700",
  },
};

export const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  (
    {
      label,
      labelClassName,
      error,
      hint,
      helperText,
      leftIcon,
      rightIcon,
      containerClassName,
      className,
      id,
      darkMode,
      rounded = "sm",
      themeColor = "primary",
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const bottomHint = error ? null : (helperText ?? hint);
    const themeStyle = THEME_INPUT_STYLES[themeColor] || THEME_INPUT_STYLES.primary;

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "mb-1.5 block text-xs font-bold text-gray-600 capitalize",
              labelClassName ? labelClassName : darkMode ? "text-slate-300" : "text-gray-600"
            )}
          >
            {label} {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className={cn(
                "pointer-events-none absolute inset-y-0 left-3 flex items-center justify-center",
                themeStyle.icon
              )}
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full border px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 shadow-2xs",
              ROUNDED_CLASSES[rounded] || "rounded-sm",
              darkMode ? themeStyle.dark : themeStyle.light,
              error ? "border-red-400 focus:border-red-500" : "",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute inset-y-0 right-2.5 flex items-center justify-center text-gray-400">
              {rightIcon}
            </span>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        ) : bottomHint ? (
          <p className="mt-1 text-xs text-gray-400">{bottomHint}</p>
        ) : null}
      </div>
    );
  }
);

CustomInput.displayName = "CustomInput";
