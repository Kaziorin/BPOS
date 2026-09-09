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
  title: string;
  description?: string;
  items?: BreadcrumbItem[];
  icon?: ReactNode;
  iconClassName?: string;
  actions?: ReactNode;
}

export function CustomBreadcrumb({
  title,
  description,
  items = [],
  icon,
  iconClassName,
  actions,
}: CustomBreadcrumbProps) {
  const router = useRouter();

  return (
    <div className="w-full bg-white rounded-md border border-slate-200 p-3.5 shadow-2xs space-y-2">
      {/* Top Section: Title & Actions (Without Bottom Line/Border) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className={iconClassName || "flex h-7 w-7 items-center justify-center rounded-md bg-teal-50 text-teal-600 shrink-0"}>
              {icon}
            </div>
          )}
          <h1 className="text-base font-bold text-gray-600 leading-none">{title}</h1>
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Bottom Section: Nav Buttons, Path, & Description */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-gray-500">
        <div className="flex items-center gap-2.5">
          {/* Nav Control Buttons (Back, Forward, Home) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition shadow-2xs"
              title="Go Back"
            >
              <ArrowLeft size={13} />
            </button>

            <button
              type="button"
              onClick={() => router.forward()}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition shadow-2xs"
              title="Go Forward"
            >
              <ArrowRight size={13} />
            </button>

            <Link
              href="/dashboard"
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition shadow-2xs"
              title="Go to Home / Dashboard"
            >
              <Home size={13} />
            </Link>
          </div>

          {/* Divider */}
          <div className="h-3.5 w-px bg-slate-200 shrink-0" />

          {/* Breadcrumb Path Hierarchy */}
          {items.length > 0 && (
            <nav className="flex items-center gap-1 text-xs text-gray-500 font-medium">
              <Link href="/dashboard" className="hover:text-teal-600 transition">
                Home
              </Link>
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1 shrink-0">
                  <ChevronRight size={13} className="text-slate-400" />
                  {item.href ? (
                    <Link href={item.href} className="hover:text-teal-600 transition">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-gray-600">{item.label}</span>
                  )}
                </div>
              ))}
            </nav>
          )}
        </div>

        {description && <p className="text-xs text-slate-500 font-medium">{description}</p>}
      </div>
    </div>
  );
}
