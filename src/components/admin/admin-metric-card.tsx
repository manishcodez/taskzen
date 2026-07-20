"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type AdminMetricCardProps = {
  title: string;
  value: number | string;
  description?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "primary";
  className?: string;
};

const toneStyles = {
  default: {
    value: "text-foreground",
    icon: "bg-muted text-muted-foreground",
  },
  success: {
    value: "text-success",
    icon: "bg-success/12 text-success",
  },
  warning: {
    value: "text-warning-foreground",
    icon: "bg-warning/20 text-warning-foreground",
  },
  primary: {
    value: "text-primary",
    icon: "bg-primary/10 text-primary",
  },
};

export function AdminMetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
  className,
}: AdminMetricCardProps) {
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        "min-w-0 rounded-[1.25rem] border border-border/80 bg-card/90 p-4 shadow-soft backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="label-caps text-muted-foreground">{title}</p>
          <p className={cn("font-display text-2xl font-semibold tracking-tight", styles.value)}>
            {value}
          </p>
          {description ? (
            <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {Icon ? (
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", styles.icon)}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
