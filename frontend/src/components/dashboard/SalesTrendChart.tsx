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

const SERIES_COLOR = "#e11d48"; // primary-600
const GRID_COLOR = "#e5e7eb"; // gray-200
const MUTED_TEXT = "#9ca3af"; // gray-400

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
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-gray-500">
        {date?.toLocaleDateString("en-BD", { weekday: "short", day: "2-digit", month: "short" })}
      </p>
      <p className="mt-0.5 font-semibold text-gray-900 [font-variant-numeric:tabular-nums]">
        {money(payload[0].value)}
      </p>
    </div>
  );
}

export function SalesTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES_COLOR} stopOpacity={0.16} />
            <stop offset="100%" stopColor={SERIES_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeDasharray="0" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => new Date(v).toLocaleDateString("en-BD", { weekday: "short" })}
          tick={{ fill: MUTED_TEXT, fontSize: 12 }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
          tick={{ fill: MUTED_TEXT, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: GRID_COLOR }} />
        <Area
          type="monotone"
          dataKey="total"
          stroke={SERIES_COLOR}
          strokeWidth={2}
          fill="url(#salesFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: SERIES_COLOR }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
