"use client";

import React, { ReactNode, isValidElement } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CustomCardProps {
  title?: ReactNode;
  subtitle?: string;
  icon?: LucideIcon | ReactNode;
  actions?: ReactNode;
  headerGradient?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  darkMode?: boolean;
}

export function CustomCard({
  title,
  subtitle,
  icon,
  actions,
  headerGradient = true,
  children,
  footer,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  darkMode = false,
}: CustomCardProps) {
  const hasHeader = Boolean(title || icon || actions);

  const renderIcon = () => {
    if (!icon) return null;
    if (isValidElement(icon)) return icon;
    if (
      typeof icon === "function" ||
      (typeof icon === "object" &&
        icon !== null &&
        ("$$typeof" in (icon as any) || "render" in (icon as any)))
    ) {
      const IconComponent = icon as React.ElementType;
      return <IconComponent size={16} className="text-brand-primary shrink-0" />;
    }
    return icon;
  };

  return (
    <div
      className={cn(
        "w-full rounded-sm border transition-all duration-200 shadow-2xs overflow-hidden flex flex-col justify-between",
        darkMode
          ? "border-slate-800 bg-slate-900 text-slate-100"
          : "border-brand-border bg-white text-gray-600",
        className
      )}
    >
      {hasHeader && (
        <div
          className={cn(
            "flex items-center justify-between px-4 sm:px-5 py-3.5 border-b shrink-0",
            darkMode
              ? "border-slate-800 bg-slate-900/80"
              : headerGradient
              ? "border-brand-light bg-brand-50/60"
              : "border-brand-light bg-white",
            headerClassName
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {renderIcon()}
            <div className="min-w-0">
              {typeof title === "string" ? (
                <h3 className="text-sm sm:text-[15px] font-bold text-brand-dark tracking-tight truncate">
                  {title}
                </h3>
              ) : (
                title
              )}
              {subtitle && (
                <p className="text-[11px] text-brand-primary font-medium leading-tight mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      <div className={cn("p-4 sm:p-5 flex-1", bodyClassName)}>{children}</div>

      {footer && (
        <div
          className={cn(
            "px-4 sm:px-5 py-3 border-t shrink-0",
            darkMode
              ? "border-slate-800 bg-slate-900/50 text-slate-400"
              : "border-brand-light bg-brand-50/30 text-slate-600",
            footerClassName
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
