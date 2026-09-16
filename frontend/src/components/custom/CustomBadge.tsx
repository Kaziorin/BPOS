import { cn } from "@/lib/cn";

export type BadgeTone = "primary" | "gray" | "green" | "amber" | "red";

const TONE_CLASSES: Record<BadgeTone, string> = {
  primary: "bg-sky-50 text-[#0284C7] border border-sky-200/90",
  gray: "bg-slate-100 text-slate-600 border border-slate-200/90",
  green: "bg-emerald-50 text-emerald-700 border border-emerald-300/80",
  amber: "bg-amber-50 text-amber-700 border border-amber-300/80",
  red: "bg-rose-50 text-rose-700 border border-rose-300/80",
};

const STATUS_TONE: Record<string, BadgeTone> = {
  COMPLETED: "green",
  CONFIRMED: "green",
  PAID: "green",
  RECEIVED: "green",
  ACTIVE: "green",
  SUCCESS: "green",
  DUE: "amber",
  PENDING: "amber",
  PARTIAL: "amber",
  RETURNED: "gray",
  CANCELLED: "red",
  FAILED: "red",
};

export interface CustomBadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
  style?: React.CSSProperties;
}

export function CustomBadge({ children, tone = "gray", className, style }: CustomBadgeProps) {
  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const norm = (status || "").toUpperCase().trim();
  const tone = STATUS_TONE[norm] ?? (norm.includes("CONFIRM") || norm.includes("PAID") || norm.includes("SUCCESS") ? "green" : "gray");
  return <CustomBadge tone={tone} className={className}>{status}</CustomBadge>;
}
