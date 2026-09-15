"use client";

import { InputHTMLAttributes, ReactNode, forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

export interface CustomInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
  darkMode?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
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

export const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  (
    {
      label,
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
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const bottomHint = error ? null : (helperText ?? hint);

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className={cn(
            "mb-1.5 block text-xs font-semibold capitalize",
            darkMode ? "text-slate-300" : "text-[#0369A1]"
          )}>
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center justify-center text-[#0284C7]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full border px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 shadow-2xs",
              ROUNDED_CLASSES[rounded] || "rounded-sm",
              darkMode
                ? "bg-slate-800 border-slate-700 text-slate-100 focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]/20"
                : "bg-white border-sky-200/90 text-slate-900 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20",
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
