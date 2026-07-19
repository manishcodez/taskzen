"use client";

import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_COLORS, CHART_TOOLTIP_STYLE } from "@/lib/analytics/chart-theme";
import type { SubjectWorkloadItem } from "@/types";

type SubjectWorkloadChartProps = {
  data: SubjectWorkloadItem[];
};

export const SubjectWorkloadChart = memo(function SubjectWorkloadChart({
  data,
}: SubjectWorkloadChartProps) {
  const chartData = data.map((item) => ({
    name: item.subjectName,
    completed: item.completed,
    pending: item.pending,
    color: item.color,
  }));

  return (
    <div
      className="w-full overflow-x-auto rounded-[1.25rem] border border-accent/10 bg-gradient-to-b from-accent/5 via-card/50 to-background p-4 shadow-soft"
      aria-label="Subject workload breakdown chart"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="label-caps text-accent">By subject</p>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
          Stacked workload
        </span>
      </div>
      <div className="h-80 min-w-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} opacity={0.25} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: CHART_COLORS.muted }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={chartData.length > 3 ? -30 : 0}
              textAnchor={chartData.length > 3 ? "end" : "middle"}
              height={chartData.length > 3 ? 72 : 36}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: CHART_COLORS.muted }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(value) => (
                <span style={{ color: CHART_COLORS.muted }}>{value}</span>
              )}
            />
            <Bar
              dataKey="completed"
              stackId="workload"
              fill={CHART_COLORS.completed}
              name="Completed"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="pending"
              stackId="workload"
              fill={CHART_COLORS.pending}
              name="Pending"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
