import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type StatTone = "primary" | "blue" | "violet" | "green" | "amber" | "red";

const TONE_STYLES: Record<StatTone, { bg: string; icon: string; border: string }> = {
  primary: {
    bg: "from-sky-100/70 via-sky-50/40 to-white",
    icon: "bg-gradient-to-tr from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white shadow-2xs",
    border: "border-sky-200/90 hover:border-[#0284C7]",
  },
  blue: {
    bg: "from-sky-100/70 via-sky-50/40 to-white",
    icon: "bg-gradient-to-tr from-[#0369A1] to-[#0284C7] text-white shadow-2xs",
    border: "border-sky-200/90 hover:border-[#0284C7]",
  },
  violet: {
    bg: "from-indigo-100/50 via-sky-50/30 to-white",
    icon: "bg-gradient-to-tr from-indigo-500 to-sky-500 text-white shadow-2xs",
    border: "border-sky-200/90 hover:border-[#0284C7]",
  },
  green: {
    bg: "from-emerald-100/50 via-sky-50/30 to-white",
    icon: "bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-2xs",
    border: "border-sky-200/90 hover:border-[#0284C7]",
  },
  amber: {
    bg: "from-amber-100/50 via-sky-50/30 to-white",
    icon: "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-2xs",
    border: "border-sky-200/90 hover:border-[#0284C7]",
  },
  red: {
    bg: "from-rose-100/50 via-sky-50/30 to-white",
    icon: "bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-2xs",
    border: "border-sky-200/90 hover:border-[#0284C7]",
  },
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
  const style = TONE_STYLES[tone] || TONE_STYLES.primary;

  return (
    <div
      className={cn(
        "group relative h-full flex items-center justify-between gap-3 overflow-hidden rounded-sm border bg-gradient-to-br p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        style.bg,
        style.border,
        className
      )}
    >
      {/* Left side: Icon */}
      <div
        className={cn(
          "flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-sm transition-transform duration-200 group-hover:scale-105",
          style.icon
        )}
      >
        <Icon size={20} />
      </div>

      {/* Right side: Value on top, Name below */}
      <div className="flex flex-col items-end text-right min-w-0">
        <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0369A1] [font-variant-numeric:tabular-nums]">
          {value}
        </p>
        <p className="mt-0.5 text-xs sm:text-[12.5px] font-bold text-gray-600 leading-snug truncate">
          {label}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-[10.5px] text-[#0284C7] font-medium leading-tight">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
