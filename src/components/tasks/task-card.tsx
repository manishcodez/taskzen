"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { OverdueBadge, PriorityBadge, StatusBadge } from "@/components/tasks/task-badges";
import {
  TaskCompleteButton,
  TaskReopenButton,
} from "@/components/tasks/task-status-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTransition } from "@/lib/motion";
import { TASK_TYPE_LABELS } from "@/lib/tasks/labels";
import { formatEstimatedTime } from "@/lib/utils/time";
import type { TaskItem } from "@/types";

type TaskCardProps = {
  task: TaskItem;
  onComplete?: (taskId: string) => void;
  onReopen?: (taskId: string) => void;
  isCompleting?: boolean;
  isReopening?: boolean;
};

export function TaskCard({
  task,
  onComplete,
  onReopen,
  isCompleting,
  isReopening,
}: TaskCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const estimatedTime = formatEstimatedTime(task.estimatedTimeMinutes);

  return (
    <Card className="surface-interactive relative h-full overflow-hidden border-border/70 shadow-soft">
      <span
        className="absolute top-0 left-0 h-1 w-full"
        style={{ backgroundColor: task.subject.color }}
      />
      <CardHeader className="gap-3 border-b border-border/50 bg-muted/15 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2.5">
            <Link href={`/tasks/${task.id}`} className="block">
              <CardTitle className="font-display line-clamp-2 text-base transition-colors hover:text-primary hover:underline">
                {task.title}
              </CardTitle>
            </Link>
            <div className="flex flex-wrap gap-2">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              {task.isOverdue ? <OverdueBadge /> : null}
            </div>
          </div>
          <motion.span
            className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-background"
            style={{ backgroundColor: task.subject.color }}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.2 }}
            transition={motionTransition.spring}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="grid gap-2 text-sm">
          {[
            { label: "Subject", value: task.subject.name },
            { label: "Type", value: TASK_TYPE_LABELS[task.type] ?? task.type },
            {
              label: "Due",
              value: task.dueDate ? new Date(task.dueDate).toLocaleString() : "No due date",
            },
            ...(estimatedTime ? [{ label: "Estimated", value: estimatedTime }] : []),
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2"
            >
              <span className="label-caps text-[10px]">{row.label}</span>
              <span className="font-medium">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border/50 pt-4">
          {task.status !== "COMPLETED" ? (
            <TaskCompleteButton
              isLoading={isCompleting}
              showLabel
              onClick={() => onComplete?.(task.id)}
            />
          ) : (
            <TaskReopenButton
              isLoading={isReopening}
              showLabel
              onClick={() => onReopen?.(task.id)}
            />
          )}
          <Button size="sm" variant="ghost" render={<Link href={`/tasks/${task.id}/edit`} />}>
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
