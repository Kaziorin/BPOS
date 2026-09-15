import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type StatTone = "primary" | "blue" | "violet" | "green" | "amber" | "red";

const TONE_STYLES: Record<StatTone, { bg: string; icon: string; border: string; accent: string }> = {
  primary: {
    bg: "from-sky-50/70 via-white to-sky-50/30",
    icon: "bg-gradient-to-tr from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white shadow-2xs",
    border: "border-sky-200/90 hover:border-[#0284C7]",
    accent: "from-[#0284C7] to-[#38BDF8]",
  },
  blue: {
    bg: "from-sky-50/70 via-white to-sky-50/30",
    icon: "bg-gradient-to-tr from-[#0369A1] to-[#0284C7] text-white shadow-2xs",
    border: "border-sky-200/90 hover:border-[#0284C7]",
    accent: "from-[#0369A1] to-[#0EA5E9]",
  },
  violet: {
    bg: "from-indigo-50/40 via-white to-sky-50/30",
    icon: "bg-gradient-to-tr from-indigo-500 to-sky-500 text-white shadow-2xs",
    border: "border-sky-200/90 hover:border-[#0284C7]",
    accent: "from-indigo-500 to-[#38BDF8]",
  },
  green: {
    bg: "from-emerald-50/40 via-white to-sky-50/30",
    icon: "bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-2xs",
    border: "border-sky-200/90 hover:border-[#0284C7]",
    accent: "from-emerald-500 to-cyan-500",
  },
  amber: {
    bg: "from-amber-50/40 via-white to-sky-50/30",
    icon: "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-2xs",
    border: "border-sky-200/90 hover:border-[#0284C7]",
    accent: "from-amber-500 to-[#0EA5E9]",
  },
  red: {
    bg: "from-rose-50/40 via-white to-sky-50/30",
    icon: "bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-2xs",
    border: "border-sky-200/90 hover:border-[#0284C7]",
    accent: "from-rose-500 to-[#0284C7]",
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
        "relative h-full flex flex-col justify-between overflow-hidden rounded-sm border bg-gradient-to-br p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        style.bg,
        style.border,
        className
      )}
    >
      {/* Top micro gradient line */}
      <div className={cn("absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r", style.accent)} />

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs sm:text-sm font-bold text-[#0369A1] leading-snug">{label}</p>
        <div className={cn("flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-sm", style.icon)}>
          <Icon size={18} />
        </div>
      </div>
      <div>
        <p className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-[#0369A1] [font-variant-numeric:tabular-nums]">
          {value}
        </p>
        {subtitle && <p className="mt-1 text-xs text-[#0284C7] font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}
