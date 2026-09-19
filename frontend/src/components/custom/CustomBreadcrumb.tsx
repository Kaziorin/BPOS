"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Home, ChevronRight } from "lucide-react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface CustomBreadcrumbProps {
  title?: string;
  description?: string;
  subtitle?: string;
  items?: BreadcrumbItem[];
  breadcrumbs?: BreadcrumbItem[];
  icon?: ReactNode;
  iconClassName?: string;
  actions?: ReactNode;
  action?: ReactNode;
}

export function CustomBreadcrumb({
  title,
  description,
  subtitle,
  items = [],
  breadcrumbs = [],
  icon,
  iconClassName,
  actions,
  action,
}: CustomBreadcrumbProps) {
  const router = useRouter();
  const desc = description || subtitle;
  const actionBtns = actions || action;
  const rawPathItems = items.length > 0 ? items : breadcrumbs;
  const pathItems = rawPathItems.filter(
    (item) => item.label.trim().toLowerCase() !== "home"
  );

  return (
    <div className="w-full bg-white rounded-sm border border-brand-border p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Left Column: Title & Nav/Path Hierarchy */}
      <div className="space-y-2">
        {(title || icon) && (
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className={iconClassName || "flex h-7 w-7 items-center justify-center rounded-sm bg-brand-50 text-brand-primary border border-brand-border shrink-0"}>
                {icon}
              </div>
            )}
            {title && <h1 className="text-base font-bold text-brand-dark leading-none">{title}</h1>}
          </div>
        )}

        {/* Nav Controls & Breadcrumb Path */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-6 w-6 items-center justify-center rounded-sm border border-brand-border bg-slate-50 text-slate-600 hover:bg-brand-50 hover:text-brand-primary hover:border-brand-primary transition shadow-2xs cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft size={13} />
            </button>

            <button
              type="button"
              onClick={() => router.forward()}
              className="flex h-6 w-6 items-center justify-center rounded-sm border border-brand-border bg-slate-50 text-slate-600 hover:bg-brand-50 hover:text-brand-primary hover:border-brand-primary transition shadow-2xs cursor-pointer"
              title="Go Forward"
            >
              <ArrowRight size={13} />
            </button>

            <Link
              href="/dashboard"
              className="flex h-6 w-6 items-center justify-center rounded-sm border border-brand-border bg-slate-50 text-slate-600 hover:bg-brand-50 hover:text-brand-primary hover:border-brand-primary transition shadow-2xs cursor-pointer"
              title="Go to Home / Dashboard"
            >
              <Home size={13} />
            </Link>
          </div>

          {pathItems.length > 0 && (
            <nav className="flex items-center gap-1 text-xs text-slate-600 font-medium">
              {pathItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1 shrink-0">
                  {idx > 0 && <ChevronRight size={13} className="text-slate-400" />}
                  {item.href ? (
                    <Link href={item.href} className="text-slate-600 hover:text-brand-primary transition">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-gray-600">{item.label}</span>
                  )}
                </div>
              ))}
            </nav>
          )}

          {desc && <p className="text-xs text-slate-500 font-medium">{desc}</p>}
        </div>
      </div>

      {/* Right Column: Action Buttons (Vertically Centered) */}
      {actionBtns && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
          {actionBtns}
        </div>
      )}
    </div>
  );
}

export default CustomBreadcrumb;
