"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp, motionTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

type SummaryCardProps = {
  title: string;
  value: number | string;
  description?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  featured?: boolean;
  hero?: boolean;
};

const toneStyles = {
  default: {
    value: "text-foreground",
    icon: "bg-primary/10 text-primary ring-primary/15",
    card: "border-border/70",
    accent: "from-primary/6 via-transparent to-brand-secondary/4",
    stripe: "bg-primary/60",
  },
  success: {
    value: "text-success",
    icon: "bg-success/12 text-success ring-success/20",
    card: "border-success/20",
    accent: "from-success/10 via-transparent to-brand-secondary/5",
    stripe: "bg-success",
  },
  warning: {
    value: "text-warning-foreground",
    icon: "bg-warning/20 text-warning-foreground ring-warning/25",
    card: "border-warning/25",
    accent: "from-warning/12 via-transparent to-brand-accent/6",
    stripe: "bg-warning",
  },
  danger: {
    value: "text-destructive",
    icon: "bg-destructive/10 text-destructive ring-destructive/20",
    card: "border-destructive/20",
    accent: "from-destructive/8 via-transparent to-brand-accent/4",
    stripe: "bg-destructive",
  },
  info: {
    value: "text-info",
    icon: "bg-info/12 text-info ring-info/20",
    card: "border-info/20",
    accent: "from-info/10 via-transparent to-primary/5",
    stripe: "bg-info",
  },
} as const;

export function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
  featured = false,
  hero = false,
}: SummaryCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const styles = toneStyles[tone];

  return (
    <motion.div
      variants={fadeUp}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
      whileHover={prefersReducedMotion ? undefined : { y: -3 }}
      transition={motionTransition.fast}
      className="h-full"
    >
      <Card
        className={cn(
          "relative h-full overflow-hidden transition-shadow duration-300",
          hero
            ? "bg-panel-elevated border-primary/20 shadow-card"
            : featured
              ? "surface-interactive bg-panel border-primary/15"
              : "surface-interactive surface-card",
          styles.card,
          hero && "min-h-[220px]",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80",
            styles.accent,
          )}
        />
        <div
          className={cn(
            "absolute top-0 left-0 h-1 rounded-full",
            styles.stripe,
            hero ? "w-24" : featured ? "w-16" : "w-10",
          )}
        />

        <CardHeader
          className={cn(
            "relative flex flex-row items-start justify-between space-y-0",
            hero ? "pb-2" : "pb-3",
          )}
        >
          <CardTitle className="label-caps">{title}</CardTitle>
          {Icon ? (
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-2xl ring-1",
                hero ? "h-12 w-12" : "h-9 w-9",
                styles.icon,
              )}
            >
              <Icon className={hero ? "h-5 w-5" : "h-4 w-4"} />
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="relative">
          <div
            className={cn(
              hero ? "metric-display text-gradient-brand" : featured ? "metric-display" : "font-display text-3xl font-semibold tracking-tight tabular-nums",
              !hero && styles.value,
            )}
          >
            {value}
          </div>
          {description ? (
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
          {hero ? (
            <p className="label-caps mt-4 text-primary/70">Completion milestone</p>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
