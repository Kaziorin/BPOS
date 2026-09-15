import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type StatTone = "primary" | "blue" | "violet" | "green" | "amber" | "red";

const TONE_ICON_CLASSES: Record<StatTone, string> = {
  primary: "bg-emerald-100 text-emerald-600",
  blue:    "bg-sky-100 text-sky-600",
  violet:  "bg-violet-100 text-violet-600",
  green:   "bg-emerald-100 text-emerald-600",
  amber:   "bg-amber-100 text-amber-600",
  red:     "bg-rose-100 text-rose-500",
};

export interface CustomStatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: StatTone;
  className?: string;
  subtitle?: string;
}

export function CustomStatCard({ label, value, icon: Icon, tone = "primary", className, subtitle }: CustomStatCardProps) {
  return (
    <div
      className={cn(
        "h-full flex flex-col justify-between rounded-md border border-sky-100/80 bg-white p-4 sm:p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs sm:text-sm font-medium text-slate-500 leading-snug">{label}</p>
        <div className={cn("flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-md", TONE_ICON_CLASSES[tone])}>
          <Icon size={17} />
        </div>
      </div>
      <div>
        <p className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-[#0369A1] [font-variant-numeric:tabular-nums]">
          {value}
        </p>
        {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}
