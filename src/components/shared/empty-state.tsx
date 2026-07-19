"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTransition, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={scaleIn}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
    >
      <Card
        className={cn(
          "relative overflow-hidden border-dashed shadow-none",
          compact
            ? "border-border/80 bg-muted/15"
            : "border-primary/20 bg-gradient-to-br from-muted/25 via-card to-brand-accent/5",
        )}
      >
        {!compact ? (
          <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-brand-accent/10 blur-2xl" />
        ) : null}
        <CardHeader
          className={cn(
            "relative items-center text-center",
            compact ? "py-6" : "py-8",
          )}
        >
          <motion.div
            className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15"
            animate={
              prefersReducedMotion
                ? undefined
                : { rotate: [0, -4, 4, 0], scale: [1, 1.04, 1] }
            }
            transition={{ ...motionTransition.slow, repeat: Infinity, repeatDelay: 4 }}
          >
            <Sparkles className="h-6 w-6 text-primary" />
          </motion.div>
          <CardTitle className="font-display text-lg">{title}</CardTitle>
          <CardDescription className="max-w-md">{description}</CardDescription>
        </CardHeader>
        {actionLabel && onAction ? (
          <CardContent className="relative flex justify-center pb-8">
            <motion.div whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}>
              <Button onClick={onAction}>{actionLabel}</Button>
            </motion.div>
          </CardContent>
        ) : null}
      </Card>
    </motion.div>
  );
}
