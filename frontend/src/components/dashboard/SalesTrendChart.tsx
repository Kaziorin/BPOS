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

const SERIES_COLOR = "#0284C7"; // Blue Ocean primary theme
const GRADIENT_TOP = "#0EA5E9";
const GRID_COLOR = "#E0F2FE"; // sky-100
const MUTED_TEXT = "#0284C7"; // sky-600

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
    <div className="rounded-sm border border-sky-200/90 bg-white/95 px-3 py-2 text-xs shadow-md backdrop-blur-xs">
      <p className="font-semibold text-[#0369A1]">
        {date?.toLocaleDateString("en-BD", { weekday: "short", day: "2-digit", month: "short" })}
      </p>
      <p className="mt-0.5 font-bold text-[#0284C7] [font-variant-numeric:tabular-nums]">
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
            <stop offset="0%" stopColor={GRADIENT_TOP} stopOpacity={0.35} />
            <stop offset="60%" stopColor={SERIES_COLOR} stopOpacity={0.12} />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => new Date(v).toLocaleDateString("en-BD", { weekday: "short" })}
          tick={{ fill: "#0369A1", fontSize: 11, fontWeight: 500 }}
          axisLine={{ stroke: "#BAE6FD" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
          tick={{ fill: "#0369A1", fontSize: 11, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#38BDF8", strokeWidth: 1, strokeDasharray: "4 4" }} />
        <Area
          type="monotone"
          dataKey="total"
          stroke={SERIES_COLOR}
          strokeWidth={2.5}
          fill="url(#salesFill)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "#ffffff", fill: SERIES_COLOR }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
