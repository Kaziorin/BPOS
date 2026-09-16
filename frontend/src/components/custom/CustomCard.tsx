"use client";

import { ReactNode } from "react";
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
    if (typeof icon === "function") {
      const IconComponent = icon as LucideIcon;
      return <IconComponent size={16} className="text-[#0284C7] shrink-0" />;
    }
    return icon;
  };

  return (
    <div
      className={cn(
        "w-full rounded-sm border transition-all duration-200 shadow-2xs overflow-hidden flex flex-col justify-between",
        darkMode
          ? "border-slate-800 bg-slate-900 text-slate-100"
          : "border-sky-100/90 bg-white text-slate-900",
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
              ? "border-sky-100/90 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/50"
              : "border-sky-100/90 bg-white",
            headerClassName
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {renderIcon()}
            <div className="min-w-0">
              {typeof title === "string" ? (
                <h3 className="text-sm sm:text-[15px] font-bold text-[#0369A1] tracking-tight truncate">
                  {title}
                </h3>
              ) : (
                title
              )}
              {subtitle && (
                <p className="text-[11px] text-[#0284C7] font-medium leading-tight mt-0.5 truncate">
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
              : "border-sky-100/90 bg-sky-50/30 text-slate-600",
            footerClassName
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
