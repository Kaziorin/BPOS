import { cn } from "@/lib/cn";

export type BadgeTone = "primary" | "gray" | "green" | "amber" | "red";

const TONE_CLASSES: Record<BadgeTone, string> = {
  primary: "bg-primary-50 text-primary-700",
  gray: "bg-gray-100 text-gray-600",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
};

const STATUS_TONE: Record<string, BadgeTone> = {
  COMPLETED: "green",
  RECEIVED: "green",
  DUE: "amber",
  RETURNED: "gray",
  CANCELLED: "red",
};

export interface CustomBadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export function CustomBadge({ children, tone = "gray", className }: CustomBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <CustomBadge tone={STATUS_TONE[status] ?? "gray"}>{status}</CustomBadge>;
}
