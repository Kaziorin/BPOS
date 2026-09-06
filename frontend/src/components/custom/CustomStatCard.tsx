import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type StatTone = "primary" | "blue" | "violet" | "green" | "amber" | "red";

const TONE_CLASSES: Record<StatTone, string> = {
  primary: "bg-primary-100 text-primary-700",
  blue: "bg-blue-100 text-blue-600",
  violet: "bg-violet-100 text-violet-600",
  green: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  red: "bg-red-100 text-red-600",
};

export interface CustomStatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: StatTone;
  className?: string;
}

export function CustomStatCard({ label, value, icon: Icon, tone = "primary", className }: CustomStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", TONE_CLASSES[tone])}>
          <Icon size={17} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 [font-variant-numeric:tabular-nums]">
        {value}
      </p>
    </div>
  );
}
