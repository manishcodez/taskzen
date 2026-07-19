"use client";

import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_COLORS, CHART_TOOLTIP_STYLE } from "@/lib/analytics/chart-theme";
import type { WeeklyCompletionTrendItem } from "@/types";

type WeeklyCompletionChartProps = {
  data: WeeklyCompletionTrendItem[];
};

export const WeeklyCompletionChart = memo(function WeeklyCompletionChart({
  data,
}: WeeklyCompletionChartProps) {
  return (
    <div
      className="w-full overflow-x-auto rounded-[1.25rem] border border-primary/10 bg-gradient-to-b from-primary/5 via-card/50 to-background p-4 shadow-soft"
      aria-label="Weekly task completion trend chart"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="label-caps text-primary">8-week trend</p>
        <span className="rounded-full bg-accent/12 px-2.5 py-1 text-[10px] font-semibold text-accent">
          Completed tasks
        </span>
      </div>
      <div className="h-72 min-w-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} opacity={0.25} />
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 10, fill: CHART_COLORS.muted }}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: CHART_COLORS.muted }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value) => [`${value ?? 0} tasks`, "Completed"]}
              labelFormatter={(label) => `Week of ${label}`}
            />
            <Bar
              dataKey="completed"
              fill={CHART_COLORS.completed}
              radius={[8, 8, 0, 0]}
              name="Completed"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
