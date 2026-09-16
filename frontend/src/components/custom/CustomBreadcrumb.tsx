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
  const pathItems = items.length > 0 ? items : breadcrumbs;

  return (
    <div className="w-full bg-white rounded-sm border border-sky-100/90 p-3.5 shadow-2xs space-y-2">
      {/* Top Section: Title & Actions */}
      {(title || icon || actionBtns) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className={iconClassName || "flex h-7 w-7 items-center justify-center rounded-sm bg-sky-50 text-[#0284C7] border border-sky-200/80 shrink-0"}>
                {icon}
              </div>
            )}
            {title && <h1 className="text-base font-bold text-[#0369A1] leading-none">{title}</h1>}
          </div>

          {actionBtns && <div className="flex items-center gap-2 shrink-0">{actionBtns}</div>}
        </div>
      )}

      {/* Bottom Section: Nav Buttons, Path, & Description */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-500">
        <div className="flex items-center gap-2.5">
          {/* Nav Control Buttons (Back, Forward, Home) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-6 w-6 items-center justify-center rounded-sm border border-sky-200/80 bg-slate-50 text-slate-600 hover:bg-[#E0F2FE] hover:text-[#0284C7] hover:border-[#0284C7] transition shadow-2xs cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft size={13} />
            </button>

            <button
              type="button"
              onClick={() => router.forward()}
              className="flex h-6 w-6 items-center justify-center rounded-sm border border-sky-200/80 bg-slate-50 text-slate-600 hover:bg-[#E0F2FE] hover:text-[#0284C7] hover:border-[#0284C7] transition shadow-2xs cursor-pointer"
              title="Go Forward"
            >
              <ArrowRight size={13} />
            </button>

            <Link
              href="/dashboard"
              className="flex h-6 w-6 items-center justify-center rounded-sm border border-sky-200/80 bg-slate-50 text-slate-600 hover:bg-[#E0F2FE] hover:text-[#0284C7] hover:border-[#0284C7] transition shadow-2xs cursor-pointer"
              title="Go to Home / Dashboard"
            >
              <Home size={13} />
            </Link>
          </div>

          {/* Divider */}
          <div className="h-3.5 w-px bg-sky-200/80 shrink-0" />

          {/* Breadcrumb Path Hierarchy */}
          {pathItems.length > 0 && (
            <nav className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Link href="/dashboard" className="hover:text-[#0284C7] transition">
                Home
              </Link>
              {pathItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1 shrink-0">
                  <ChevronRight size={13} className="text-slate-400" />
                  {item.href ? (
                    <Link href={item.href} className="hover:text-[#0284C7] transition">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-800">{item.label}</span>
                  )}
                </div>
              ))}
            </nav>
          )}
        </div>

        {desc && <p className="text-xs text-slate-500 font-medium">{desc}</p>}
      </div>
    </div>
  );
}
