"use client";

import React, { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "xs" | "sm" | "md" | "lg";
export type ThemeColor = "primary" | "teal" | "orange" | "indigo" | "emerald" | "amber" | "rose" | "purple" | "blue";

export interface CustomButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  themeColor?: ThemeColor;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: any;
  rightIcon?: any;
  icon?: any;
  darkMode?: boolean;
}

const THEME_PRIMARY_CLASSES: Record<ThemeColor, string> = {
  primary: "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white shadow-xs hover:brightness-105 active:scale-98 focus-visible:ring-sky-300",
  blue: "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white shadow-xs hover:brightness-105 active:scale-98 focus-visible:ring-sky-300",
  teal: "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white shadow-xs hover:brightness-105 active:scale-98 focus-visible:ring-sky-300",
  orange: "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white shadow-xs hover:brightness-105 active:scale-98 focus-visible:ring-sky-300",
  emerald: "bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700 focus-visible:ring-emerald-300",
  indigo: "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white shadow-xs hover:brightness-105 active:scale-98 focus-visible:ring-sky-300",
  amber: "bg-amber-600 text-white shadow-2xs hover:bg-amber-700 focus-visible:ring-amber-300",
  rose: "bg-rose-600 text-white shadow-2xs hover:bg-rose-700 focus-visible:ring-rose-300",
  purple: "bg-purple-600 text-white shadow-2xs hover:bg-purple-700 focus-visible:ring-purple-300",
};

const VARIANT_CLASSES = (darkMode: boolean): Record<ButtonVariant, string> => ({
  primary:
    "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white shadow-xs hover:brightness-105 active:scale-98 focus-visible:ring-sky-300",
  secondary: darkMode
    ? "bg-slate-800 text-slate-200 hover:bg-slate-700 focus-visible:ring-slate-700"
    : "bg-sky-50 text-[#0369A1] hover:bg-[#E0F2FE] hover:text-[#0284C7] border border-sky-200/80 focus-visible:ring-sky-300",
  outline: darkMode
    ? "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 focus-visible:ring-slate-700"
    : "border border-sky-200 bg-white text-[#0369A1] hover:bg-sky-50 hover:border-[#0284C7] focus-visible:ring-sky-300",
  ghost: darkMode
    ? "text-slate-400 hover:bg-slate-800 focus-visible:ring-slate-700"
    : "text-[#0284C7] hover:bg-sky-50 focus-visible:ring-sky-300",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300 shadow-2xs",
});

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: "h-7 px-2 text-[11px] gap-1",
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
      icon,
      disabled,
      className,
      children,
      darkMode = false,
      ...props
    },
    ref
  ) => {
    const variantClass =
      variant === "primary" && themeColor
        ? THEME_PRIMARY_CLASSES[themeColor]
        : VARIANT_CLASSES(darkMode)[variant];

    const effectiveLeftIcon = leftIcon ?? icon;

    const renderIconNode = (iconNode: ReactNode) => {
      if (!iconNode) return null;
      if (React.isValidElement(iconNode)) return iconNode;
      if (
        typeof iconNode === "function" ||
        (typeof iconNode === "object" &&
          iconNode !== null &&
          ("$$typeof" in (iconNode as any) || "render" in (iconNode as any)))
      ) {
        const IconComp = iconNode as React.ElementType;
        const iconSize = size === "xs" || size === "sm" ? 14 : 16;
        return <IconComp size={iconSize} />;
      }
      return iconNode;
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-sm font-medium transition-all cursor-pointer select-none",
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
          <Loader2 size={size === "xs" || size === "sm" ? 14 : 16} className="animate-spin" />
        ) : (
          renderIconNode(effectiveLeftIcon)
        )}
        {children}
        {!loading && renderIconNode(rightIcon)}
      </button>
    );
  }
);

CustomButton.displayName = "CustomButton";
