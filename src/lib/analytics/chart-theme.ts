export const CHART_COLORS = {
  completed: "oklch(0.56 0.12 155)",
  pending: "oklch(0.42 0.07 205)",
  overdue: "oklch(0.56 0.2 28)",
  primary: "oklch(0.42 0.07 205)",
  secondary: "oklch(0.58 0.06 205)",
  accent: "oklch(0.72 0.13 38)",
  muted: "oklch(0.5 0.03 55)",
} as const;

export const CHART_TOOLTIP_STYLE = {
  borderRadius: "14px",
  border: "1px solid oklch(0.88 0.02 95)",
  backgroundColor: "oklch(0.995 0.01 95)",
  color: "oklch(0.26 0.035 55)",
  boxShadow: "0 12px 32px oklch(0.35 0.03 55 / 0.1)",
} as const;
