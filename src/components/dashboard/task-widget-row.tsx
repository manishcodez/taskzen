"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { OverdueBadge, PriorityBadge, StatusBadge } from "@/components/tasks/task-badges";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp, motionTransition } from "@/lib/motion";
import { formatEstimatedTime } from "@/lib/utils/time";
import type { TaskItem } from "@/types";

type TaskWidgetRowProps = {
  task: TaskItem;
  index?: number;
};

export function TaskWidgetRow({ task, index = 0 }: TaskWidgetRowProps) {
  const prefersReducedMotion = useReducedMotion();
  const estimatedTime = formatEstimatedTime(task.estimatedTimeMinutes);

  return (
    <motion.div
      variants={fadeUp}
      whileHover={prefersReducedMotion ? undefined : { x: 4 }}
      transition={motionTransition.fast}
    >
      <Link
        href={`/tasks/${task.id}`}
        className="group surface-interactive relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-border/70 bg-card/90 p-4 shadow-soft hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
      >
        <span
          className="absolute top-0 left-0 h-full w-1 rounded-l-2xl opacity-80 transition-opacity group-hover:opacity-100"
          style={{ backgroundColor: task.subject.color }}
        />
        <div className="min-w-0 space-y-1.5 pl-2">
          <p className="truncate font-medium transition-colors group-hover:text-primary">
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span
              className="h-2 w-2 shrink-0 rounded-full ring-2 ring-background"
              style={{ backgroundColor: task.subject.color }}
            />
            <span className="truncate">{task.subject.name}</span>
            {task.dueDate ? (
              <span className="shrink-0">• {new Date(task.dueDate).toLocaleDateString()}</span>
            ) : null}
            {estimatedTime ? <span className="shrink-0">• {estimatedTime}</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pl-2 sm:pl-0">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
          {task.isOverdue ? <OverdueBadge /> : null}
        </div>
        {!prefersReducedMotion ? (
          <span className="pointer-events-none absolute right-3 bottom-3 text-[10px] font-semibold text-muted-foreground/40 tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
        ) : null}
      </Link>
    </motion.div>
  );
}
