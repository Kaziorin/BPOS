"use client";

import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export type ThemeColor = "primary" | "teal" | "orange" | "indigo" | "emerald" | "amber" | "rose" | "purple" | "blue";

export interface CustomButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  themeColor?: ThemeColor;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const THEME_PRIMARY_CLASSES: Record<ThemeColor, string> = {
  primary: "bg-primary-600 text-white shadow-2xs hover:bg-primary-700 focus-visible:ring-primary-300",
  blue: "bg-blue-600 text-white shadow-2xs hover:bg-blue-700 focus-visible:ring-blue-300",
  teal: "bg-teal-600 text-white shadow-2xs hover:bg-teal-700 focus-visible:ring-teal-300",
  orange: "bg-orange-600 text-white shadow-2xs hover:bg-orange-700 focus-visible:ring-orange-300",
  emerald: "bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700 focus-visible:ring-emerald-300",
  indigo: "bg-indigo-600 text-white shadow-2xs hover:bg-indigo-700 focus-visible:ring-indigo-300",
  amber: "bg-amber-600 text-white shadow-2xs hover:bg-amber-700 focus-visible:ring-amber-300",
  rose: "bg-rose-600 text-white shadow-2xs hover:bg-rose-700 focus-visible:ring-rose-300",
  purple: "bg-purple-600 text-white shadow-2xs hover:bg-purple-700 focus-visible:ring-purple-300",
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white shadow-2xs hover:bg-primary-700 focus-visible:ring-primary-300",
  secondary: "bg-slate-100 text-gray-700 hover:bg-slate-200 focus-visible:ring-slate-300",
  outline:
    "border border-slate-200 bg-white text-gray-700 hover:bg-slate-50 focus-visible:ring-slate-300",
  ghost: "text-gray-600 hover:bg-slate-100 focus-visible:ring-slate-300",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300 shadow-2xs",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-xs font-semibold gap-2",
  lg: "h-11 px-5 text-sm font-semibold gap-2",
};

export const CustomButton = forwardRef<HTMLButtonElement, CustomButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      themeColor,
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const variantClass =
      variant === "primary" && themeColor
        ? THEME_PRIMARY_CLASSES[themeColor]
        : VARIANT_CLASSES[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors cursor-pointer select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variantClass,
          SIZE_CLASSES[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

CustomButton.displayName = "CustomButton";
