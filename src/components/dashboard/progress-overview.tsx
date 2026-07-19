"use client";

import { motion } from "framer-motion";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp, motionTransition } from "@/lib/motion";
import type { DashboardCounts } from "@/types";

type ProgressOverviewProps = {
  counts: DashboardCounts;
};

export function ProgressOverview({ counts }: ProgressOverviewProps) {
  const prefersReducedMotion = useReducedMotion();
  const completedWidth = counts.total === 0 ? 0 : counts.completionPercentage;
  const pendingWidth = counts.total === 0 ? 0 : 100 - counts.completionPercentage;

  return (
    <motion.div
      variants={fadeUp}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
    >
      <Card className="bg-panel overflow-hidden border-primary/15">
        <CardHeader className="border-b border-border/50 pb-4">
          <p className="label-caps mb-1">Workload</p>
          <CardTitle className="font-display text-xl">Progress overview</CardTitle>
          <CardDescription>Track how much of your workload is complete.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="metric-display text-gradient-brand">{counts.completionPercentage}%</p>
              <p className="mt-1 text-sm text-muted-foreground">Completion rate</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-success/20 bg-success/8 px-4 py-3">
                <p className="label-caps text-success/80">Completed</p>
                <p className="font-display text-2xl font-semibold text-success tabular-nums">
                  {counts.completed}
                </p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/6 px-4 py-3">
                <p className="label-caps text-primary/70">Pending</p>
                <p className="font-display text-2xl font-semibold text-primary tabular-nums">
                  {counts.pending}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative h-4 overflow-hidden rounded-full bg-muted/80 p-0.5">
              <div className="absolute inset-0.5 flex overflow-hidden rounded-full">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-success via-brand-secondary to-primary"
                  initial={prefersReducedMotion ? false : { width: 0 }}
                  animate={{ width: `${completedWidth}%` }}
                  transition={{ ...motionTransition.slow, delay: 0.15 }}
                />
                <motion.div
                  className="h-full rounded-full bg-primary/20"
                  initial={prefersReducedMotion ? false : { width: 0 }}
                  animate={{ width: `${pendingWidth}%` }}
                  transition={{ ...motionTransition.slow, delay: 0.25 }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-success to-brand-secondary" />
                Completed
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary/35" />
                Pending
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
