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
  primary: "bg-brand-gradient text-white shadow-md hover:brightness-110 active:scale-98 focus-visible:ring-brand-border font-bold",
  blue: "bg-gradient-to-r from-blue-600 via-sky-500 to-sky-400 text-white shadow-md shadow-blue-950/25 hover:brightness-110 active:scale-98 focus-visible:ring-blue-300 font-bold",
  teal: "bg-gradient-to-r from-[#00796b] via-[#00897b] to-[#26a69a] text-white shadow-md shadow-teal-950/25 hover:brightness-110 active:scale-98 focus-visible:ring-teal-300 font-bold",
  orange: "bg-gradient-to-r from-orange-500 via-amber-500 to-amber-400 text-white shadow-md shadow-orange-950/25 hover:brightness-110 active:scale-98 focus-visible:ring-orange-300 font-bold",
  emerald: "bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-500 text-white shadow-md shadow-emerald-950/25 hover:brightness-110 active:scale-98 focus-visible:ring-emerald-300 font-bold",
  indigo: "bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-500 text-white shadow-md shadow-indigo-950/25 hover:brightness-110 active:scale-98 focus-visible:ring-indigo-300 font-bold",
  amber: "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 text-white shadow-md shadow-amber-950/25 hover:brightness-110 active:scale-98 focus-visible:ring-amber-300 font-bold",
  rose: "bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 text-white shadow-md shadow-rose-950/25 hover:brightness-110 active:scale-98 focus-visible:ring-rose-300 font-bold",
  purple: "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white shadow-md shadow-purple-950/25 hover:brightness-110 active:scale-98 focus-visible:ring-purple-300 font-bold",
};

const VARIANT_CLASSES = (darkMode: boolean): Record<ButtonVariant, string> => ({
  primary:
    "bg-brand-gradient text-white shadow-md hover:brightness-110 active:scale-98 focus-visible:ring-brand-border font-bold",
  secondary: darkMode
    ? "bg-slate-800 text-slate-200 hover:bg-slate-700 focus-visible:ring-slate-700 font-bold"
    : "bg-brand-50 text-brand-dark hover:bg-brand-100 hover:text-brand-dark border border-brand-border focus-visible:ring-brand-border font-bold",
  outline: darkMode
    ? "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 focus-visible:ring-slate-700 font-bold"
    : "border border-brand-border bg-white text-slate-700 hover:bg-brand-50 hover:border-brand-primary focus-visible:ring-brand-border font-bold shadow-2xs",
  ghost: darkMode
    ? "text-slate-400 hover:bg-slate-800 focus-visible:ring-slate-700 font-bold"
    : "text-brand-primary hover:bg-brand-50 focus-visible:ring-brand-border font-bold",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300 shadow-md font-bold",
});

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: "px-2.5 py-1 text-[11px] font-bold gap-1.5",
  sm: "px-4 py-2 text-xs sm:text-sm font-bold gap-2",
  md: "px-4 py-2 text-xs sm:text-sm font-bold gap-2",
  lg: "px-5 py-2.5 text-sm font-bold gap-2",
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
    const getVariantClass = () => {
      if (variant === "primary" && themeColor) {
        return THEME_PRIMARY_CLASSES[themeColor];
      }
      if (themeColor === "primary") {
        if (variant === "secondary") {
          return darkMode
            ? "bg-slate-800 text-brand-primary hover:bg-slate-700 focus-visible:ring-brand-border font-bold"
            : "bg-brand-50 text-brand-dark hover:bg-brand-100 hover:text-brand-dark border border-brand-border focus-visible:ring-brand-border font-bold";
        }
        if (variant === "outline") {
          return darkMode
            ? "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:border-brand-primary hover:text-brand-primary focus-visible:ring-brand-border font-bold"
            : "border border-brand-border bg-white text-brand-dark hover:bg-brand-50 hover:border-brand-primary hover:text-brand-primary focus-visible:ring-brand-border font-bold shadow-2xs";
        }
        if (variant === "ghost") {
          return darkMode
            ? "text-slate-400 hover:bg-slate-800 hover:text-brand-primary focus-visible:ring-brand-border font-bold"
            : "text-brand-primary hover:bg-brand-50 focus-visible:ring-brand-border font-bold";
        }
      }
      if (themeColor === "teal") {
        if (variant === "secondary") {
          return darkMode
            ? "bg-slate-800 text-teal-300 hover:bg-slate-700 focus-visible:ring-teal-400 font-bold"
            : "bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800 border border-teal-200/80 focus-visible:ring-teal-300 font-bold";
        }
        if (variant === "outline") {
          return darkMode
            ? "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:border-teal-500 hover:text-teal-300 focus-visible:ring-teal-400 font-bold"
            : "border border-slate-200 bg-white text-slate-700 hover:bg-teal-50/70 hover:border-teal-400 hover:text-[#00796b] focus-visible:ring-teal-300 font-bold shadow-2xs";
        }
        if (variant === "ghost") {
          return darkMode
            ? "text-slate-400 hover:bg-slate-800 hover:text-teal-300 focus-visible:ring-teal-400 font-bold"
            : "text-[#00796b] hover:bg-teal-50 focus-visible:ring-teal-300 font-bold";
        }
      }
      return VARIANT_CLASSES(darkMode)[variant];
    };

    const variantClass = getVariantClass();

    const effectiveLeftIcon = leftIcon ?? icon;

    const renderIconNode = (iconNode: ReactNode) => {
      if (!iconNode) return null;
      if (React.isValidElement(iconNode)) {
        return React.cloneElement(iconNode as React.ReactElement<any>, {
          className: cn(
            "shrink-0",
            (iconNode as React.ReactElement<any>).props?.className
          ),
        });
      }
      if (
        typeof iconNode === "function" ||
        (typeof iconNode === "object" &&
          iconNode !== null &&
          ("$$typeof" in (iconNode as any) || "render" in (iconNode as any)))
      ) {
        const IconComp = iconNode as React.ElementType;
        const iconSize = size === "xs" ? 13 : 15;
        return <IconComp size={iconSize} className="shrink-0" />;
      }
      return iconNode;
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-sm font-bold transition hover:brightness-110 active:scale-98 cursor-pointer select-none",
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
          <Loader2 size={size === "xs" ? 13 : 15} className="animate-spin shrink-0" />
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
