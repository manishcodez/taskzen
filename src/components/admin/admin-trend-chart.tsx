"use client";

import { memo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_COLORS, CHART_TOOLTIP_STYLE } from "@/lib/analytics/chart-theme";
import type { AdminTrendPoint } from "@/types";

type AdminTrendChartProps = {
  data: AdminTrendPoint[];
  title: string;
  badge?: string;
  valueLabel?: string;
  variant?: "bar" | "area";
  color?: string;
};

function formatDateLabel(value: string): string {
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-");
    return `${month}/${year.slice(2)}`;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const AdminTrendChart = memo(function AdminTrendChart({
  data,
  title,
  badge,
  valueLabel = "Count",
  variant = "bar",
  color = CHART_COLORS.completed,
}: AdminTrendChartProps) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[1.25rem] border border-primary/10 bg-gradient-to-b from-primary/5 via-card/50 to-background p-4 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="label-caps text-primary">{title}</p>
        {badge ? (
          <span className="rounded-full bg-accent/12 px-2.5 py-1 text-[10px] font-semibold text-accent">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="h-64 min-w-0 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          {variant === "area" ? (
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} opacity={0.25} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                tick={{ fontSize: 10, fill: CHART_COLORS.muted }}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value) => [`${value ?? 0}`, valueLabel]}
                labelFormatter={(label) => formatDateLabel(String(label))}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={color}
                fill={color}
                fillOpacity={0.18}
                strokeWidth={2}
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} opacity={0.25} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                tick={{ fontSize: 10, fill: CHART_COLORS.muted }}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value) => [`${value ?? 0}`, valueLabel]}
                labelFormatter={(label) => formatDateLabel(String(label))}
              />
              <Bar dataKey="count" fill={color} radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
});
