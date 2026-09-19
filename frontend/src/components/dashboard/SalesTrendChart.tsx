"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendPoint } from "@/lib/types";
import { money } from "@/lib/format";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const date = label ? new Date(label) : null;
  return (
    <div className="rounded-sm border border-brand-border bg-white/95 px-3 py-2 text-xs shadow-md backdrop-blur-xs">
      <p className="font-semibold text-brand-dark">
        {date?.toLocaleDateString("en-BD", { weekday: "short", day: "2-digit", month: "short" })}
      </p>
      <p className="mt-0.5 font-bold text-brand-primary [font-variant-numeric:tabular-nums]">
        {money(payload[0].value)}
      </p>
    </div>
  );
}

export function SalesTrendChart({ data }: { data?: TrendPoint[] | null }) {
  const chartData = Array.isArray(data) ? data : [];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--theme-primary-500, #0EA5E9)" stopOpacity={0.4} />
            <stop offset="60%" stopColor="var(--theme-primary-600, #0284C7)" stopOpacity={0.15} />
            <stop offset="100%" stopColor="var(--theme-accent, #38BDF8)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--theme-primary-100, #E0F2FE)" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => new Date(v).toLocaleDateString("en-BD", { weekday: "short" })}
          tick={{ fill: "var(--theme-primary-700, #0369A1)", fontSize: 11, fontWeight: 500 }}
          axisLine={{ stroke: "var(--theme-primary-200, #BAE6FD)" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
          tick={{ fill: "var(--theme-primary-700, #0369A1)", fontSize: 11, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--theme-accent, #38BDF8)", strokeWidth: 1, strokeDasharray: "4 4" }} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--theme-primary-600, #0284C7)"
          strokeWidth={2.5}
          fill="url(#salesFill)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "#ffffff", fill: "var(--theme-primary-600, #0284C7)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
