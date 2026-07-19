"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { TaskCard } from "@/components/tasks/task-card";
import { OverdueBadge, PriorityBadge, StatusBadge } from "@/components/tasks/task-badges";
import {
  TaskCompleteButton,
  TaskReopenButton,
} from "@/components/tasks/task-status-actions";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { TASK_TYPE_LABELS } from "@/lib/tasks/labels";
import { formatEstimatedTime } from "@/lib/utils/time";
import type { TaskItem } from "@/types";

type TaskListProps = {
  tasks: TaskItem[];
  onComplete?: (taskId: string) => void;
  onReopen?: (taskId: string) => void;
  activeTaskId?: string | null;
  activeAction?: "complete" | "reopen" | null;
};

export function TaskList({
  tasks,
  onComplete,
  onReopen,
  activeTaskId,
  activeAction,
}: TaskListProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      <div className="bg-panel hidden overflow-hidden md:block">
        <div className="border-b border-border/50 px-5 py-4">
          <p className="label-caps">All tasks</p>
        </div>
        <table className="min-w-full text-sm">
          <thead className="border-b border-border/70 bg-muted/25 text-left">
            <tr>
              {["Task", "Subject", "Type", "Priority", "Status", "Due", "Est.", "Actions"].map(
                (heading) => (
                  <th key={heading} className="label-caps px-5 py-3.5">
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <motion.tbody
            variants={staggerContainer(0.04, 0.02)}
            initial={prefersReducedMotion ? false : "hidden"}
            animate="show"
          >
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => {
                const estimatedTime = formatEstimatedTime(task.estimatedTimeMinutes);
                const isCompleting = activeTaskId === task.id && activeAction === "complete";
                const isReopening = activeTaskId === task.id && activeAction === "reopen";

                return (
                  <motion.tr
                    key={task.id}
                    layout={!prefersReducedMotion}
                    variants={fadeUp}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, x: -12 }}
                    className="border-b border-border/50 transition-colors last:border-b-0 hover:bg-muted/20"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="font-medium transition-colors hover:text-primary hover:underline"
                      >
                        {task.title}
                      </Link>
                      {task.isOverdue ? (
                        <div className="mt-2">
                          <OverdueBadge />
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full ring-2 ring-background"
                          style={{ backgroundColor: task.subject.color }}
                        />
                        {task.subject.name}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {TASK_TYPE_LABELS[task.type] ?? task.type}
                    </td>
                    <td className="px-5 py-4">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {task.dueDate ? new Date(task.dueDate).toLocaleString() : "—"}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{estimatedTime ?? "—"}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {task.status !== "COMPLETED" ? (
                          <TaskCompleteButton
                            isLoading={isCompleting}
                            onClick={() => onComplete?.(task.id)}
                          />
                        ) : (
                          <TaskReopenButton
                            isLoading={isReopening}
                            onClick={() => onReopen?.(task.id)}
                          />
                        )}
                        <Button size="sm" variant="ghost" render={<Link href={`/tasks/${task.id}`} />}>
                          View
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </motion.tbody>
        </table>
      </div>

      <motion.div
        className="grid gap-4 md:hidden"
        variants={staggerContainer(0.06, 0.03)}
        initial={prefersReducedMotion ? false : "hidden"}
        animate="show"
      >
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout={!prefersReducedMotion}
              variants={fadeUp}
              exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
            >
              <TaskCard
                task={task}
                onComplete={onComplete}
                onReopen={onReopen}
                isCompleting={activeTaskId === task.id && activeAction === "complete"}
                isReopening={activeTaskId === task.id && activeAction === "reopen"}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
