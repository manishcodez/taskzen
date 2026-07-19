"use client";

import { memo, useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { CHART_COLORS, CHART_TOOLTIP_STYLE } from "@/lib/analytics/chart-theme";

type TaskStatusChartProps = {
  completed: number;
  pending: number;
};

export const TaskStatusChart = memo(function TaskStatusChart({
  completed,
  pending,
}: TaskStatusChartProps) {
  const total = completed + pending;
  const data = useMemo(
    () => [
      { name: "Completed", value: completed, color: CHART_COLORS.completed },
      { name: "Pending", value: pending, color: CHART_COLORS.pending },
    ],
    [completed, pending],
  );

  return (
    <div
      className="relative rounded-[1.25rem] border border-primary/10 bg-gradient-to-b from-primary/5 via-card/50 to-background p-4 shadow-soft"
      aria-label="Task status breakdown chart"
    >
      <div className="mb-3">
        <p className="label-caps text-primary">Status mix</p>
      </div>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-6">
        <span className="metric-display text-primary">{total}</span>
        <span className="label-caps mt-1 normal-case tracking-[0.12em]">Total tasks</span>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={100}
              paddingAngle={3}
              strokeWidth={2}
              stroke="oklch(0.985 0.018 95)"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value) => [`${value ?? 0} tasks`]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: CHART_COLORS.completed }}
          />
          Completed ({completed})
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: CHART_COLORS.pending }}
          />
          Pending ({pending})
        </div>
      </div>
    </div>
  );
});
