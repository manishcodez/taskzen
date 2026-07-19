"use client";

import { motion } from "framer-motion";

import { TaskWidgetRow } from "@/components/dashboard/task-widget-row";
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
import { cn } from "@/lib/utils";
import type { TaskItem } from "@/types";

type TaskWidgetListProps = {
  title: string;
  description: string;
  tasks: TaskItem[];
  emptyTitle: string;
  emptyDescription: string;
  accent?: "primary" | "secondary" | "accent";
  compact?: boolean;
};

const accentStyles = {
  primary: "border-t-primary/70 before:bg-primary/8",
  secondary: "border-t-brand-secondary/80 before:bg-brand-secondary/8",
  accent: "border-t-brand-accent/80 before:bg-brand-accent/10",
} as const;

export function TaskWidgetList({
  title,
  description,
  tasks,
  emptyTitle,
  emptyDescription,
  accent = "secondary",
  compact = false,
}: TaskWidgetListProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={fadeUp}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
      className="h-full"
    >
      <Card
        className={cn(
          "relative h-full overflow-hidden border-t-[3px] bg-panel before:pointer-events-none before:absolute before:inset-0",
          accentStyles[accent],
        )}
      >
        <CardHeader className={cn("relative border-b border-border/50 pb-4", compact ? "py-4" : "pb-4")}>
          <p className="label-caps mb-1.5">Focus</p>
          <CardTitle className="font-display text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className={cn("relative pt-5", compact && "pt-4")}>
          {tasks.length === 0 ? (
            <EmptyState title={emptyTitle} description={emptyDescription} compact />
          ) : (
            <motion.div
              className="space-y-2.5"
              variants={staggerContainer(0.05, 0.02)}
              initial={prefersReducedMotion ? false : "hidden"}
              animate="show"
            >
              {tasks.map((task, index) => (
                <TaskWidgetRow key={task.id} task={task} index={index} />
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
