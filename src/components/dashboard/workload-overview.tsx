"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";
import type { WorkloadOverviewItem } from "@/types";

type WorkloadOverviewProps = {
  items: WorkloadOverviewItem[];
};

export function WorkloadOverview({ items }: WorkloadOverviewProps) {
  const prefersReducedMotion = useReducedMotion();
  const maxPending = Math.max(...items.map((item) => item.pendingCount), 1);

  return (
    <motion.div
      variants={fadeUp}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
    >
      <Card className="relative overflow-hidden border-t-[3px] border-t-brand-accent/80 bg-panel before:pointer-events-none before:absolute before:inset-0 before:bg-brand-accent/6">
        <CardHeader className="relative border-b border-border/50 pb-4">
          <p className="label-caps mb-1.5">Subjects</p>
          <CardTitle className="font-display text-lg">Workload overview</CardTitle>
          <CardDescription>Pending workload grouped by subject.</CardDescription>
        </CardHeader>
        <CardContent className="relative pt-5">
          {items.length === 0 ? (
            <EmptyState
              title="No pending workload"
              description="When you add tasks, subject workload will appear here."
              compact
            />
          ) : (
            <motion.div
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
              variants={staggerContainer(0.06, 0.03)}
              initial={prefersReducedMotion ? false : "hidden"}
              animate="show"
            >
              {items.map((item) => {
                const loadPercent = Math.round((item.pendingCount / maxPending) * 100);

                return (
                  <motion.div key={item.subjectId} variants={fadeUp}>
                    <Link
                      href={`/subjects/${item.subjectId}`}
                      className="group surface-interactive flex h-full flex-col gap-4 rounded-2xl border border-border/70 bg-card/90 p-4 shadow-soft hover:border-primary/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-background"
                            style={{ backgroundColor: item.color }}
                          />
                          <div>
                            <p className="font-medium transition-colors group-hover:text-primary">
                              {item.subjectName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.pendingCount} pending task{item.pendingCount === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                        <span className="font-display text-2xl font-semibold text-primary/80 tabular-nums">
                          {item.pendingCount}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted/80">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color }}
                            initial={prefersReducedMotion ? false : { width: 0 }}
                            animate={{ width: `${loadPercent}%` }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {item.overdueCount > 0 ? (
                            <span className="rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 font-medium text-destructive">
                              {item.overdueCount} overdue
                            </span>
                          ) : null}
                          {item.dueThisWeekCount > 0 ? (
                            <span className="rounded-full border border-info/20 bg-info/10 px-2.5 py-1 font-medium text-info">
                              {item.dueThisWeekCount} due this week
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
