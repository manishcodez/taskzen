"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { OverdueBadge, PriorityBadge, StatusBadge } from "@/components/tasks/task-badges";
import {
  TaskCompleteButton,
  TaskReopenButton,
} from "@/components/tasks/task-status-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiRequestError } from "@/lib/api-client";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_TYPE_LABELS,
} from "@/lib/tasks/labels";
import { formatEstimatedTime } from "@/lib/utils/time";
import {
  useCompleteTask,
  useDeleteTask,
  useReopenTask,
  useTask,
} from "@/hooks/use-tasks";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";

type TaskDetailViewProps = {
  taskId: string;
};

export function TaskDetailView({ taskId }: TaskDetailViewProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { data: task, isLoading, isError, error, refetch } = useTask(taskId);
  const completeTask = useCompleteTask();
  const reopenTask = useReopenTask();
  const deleteTask = useDeleteTask();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleComplete() {
    if (!task) return;

    setActionError(null);
    setSuccessMessage(null);

    try {
      await completeTask.mutateAsync(task.id);
      setSuccessMessage("Task marked as completed.");
    } catch (mutationError) {
      setActionError(
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Unable to complete task.",
      );
    }
  }

  async function handleReopen() {
    if (!task) return;

    setActionError(null);
    setSuccessMessage(null);

    try {
      await reopenTask.mutateAsync(task.id);
      setSuccessMessage("Task reopened.");
    } catch (mutationError) {
      setActionError(
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Unable to reopen task.",
      );
    }
  }

  async function handleDelete() {
    setActionError(null);

    try {
      await deleteTask.mutateAsync(taskId);
      router.push("/tasks");
    } catch (mutationError) {
      setActionError(
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Unable to delete task.",
      );
      setIsDeleteOpen(false);
    }
  }

  if (isLoading) {
    return <LoadingSkeleton variant="detail" />;
  }

  if (isError || !task) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Unable to load task."}
        onRetry={() => refetch()}
      />
    );
  }

  const estimatedTime = formatEstimatedTime(task.estimatedTimeMinutes);

  const overviewFields = [
    {
      label: "Subject",
      content: (
        <div className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full ring-2 ring-background"
            style={{ backgroundColor: task.subject.color }}
          />
          <Link
            href={`/subjects/${task.subject.id}`}
            className="font-medium transition-colors hover:text-primary hover:underline"
          >
            {task.subject.name}
          </Link>
        </div>
      ),
    },
    {
      label: "Type",
      content: (
        <p className="text-sm font-medium">{TASK_TYPE_LABELS[task.type] ?? task.type}</p>
      ),
    },
    {
      label: "Priority",
      content: (
        <p className="text-sm font-medium">
          {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
        </p>
      ),
    },
    {
      label: "Status",
      content: (
        <p className="text-sm font-medium">{TASK_STATUS_LABELS[task.status] ?? task.status}</p>
      ),
    },
    {
      label: "Due date",
      content: (
        <p className="text-sm font-medium">
          {task.dueDate ? new Date(task.dueDate).toLocaleString() : "No due date"}
        </p>
      ),
    },
    {
      label: "Estimated time",
      content: <p className="text-sm font-medium">{estimatedTime ?? "Not set"}</p>,
    },
    {
      label: "Completed at",
      content: (
        <p className="text-sm font-medium">
          {task.completedAt ? new Date(task.completedAt).toLocaleString() : "Not completed"}
        </p>
      ),
      span: 2,
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer(0.05, 0.02)}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <PageHeader
          eyebrow="Task details"
          title={task.title}
          description="Review task details, update progress, or manage completion."
          action={
            <Button variant="outline" render={<Link href="/tasks" />}>
              <ArrowLeft className="h-4 w-4" />
              Back to tasks
            </Button>
          }
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {successMessage ? (
          <motion.div
            key="success"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
          >
            {successMessage}
          </motion.div>
        ) : null}
        {actionError ? (
          <motion.div
            key="error"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {actionError}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        variants={fadeUp}
        className="bg-panel flex flex-col gap-4 p-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
      >
        <div className="flex flex-wrap gap-2">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
          {task.isOverdue ? <OverdueBadge /> : null}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border/50 pt-4 sm:border-t-0 sm:pt-0">
          {task.status !== "COMPLETED" ? (
            <TaskCompleteButton
              size="default"
              showLabel
              label="Mark complete"
              isLoading={completeTask.isPending}
              onClick={() => void handleComplete()}
            />
          ) : (
            <TaskReopenButton
              size="default"
              showLabel
              label="Reopen task"
              isLoading={reopenTask.isPending}
              onClick={() => void handleReopen()}
            />
          )}
          <Button variant="outline" render={<Link href={`/tasks/${task.id}/edit`} />}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div variants={fadeUp}>
          <Card className="bg-panel overflow-hidden">
            <CardHeader className="border-b border-border/50 pb-4">
              <p className="label-caps mb-1">Summary</p>
              <CardTitle className="font-display text-lg">Overview</CardTitle>
              <CardDescription>Core task information and scheduling details.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-5 sm:grid-cols-2">
              {overviewFields.map((field) => (
                <div
                  key={field.label}
                  className={`rounded-2xl border border-border/60 bg-muted/15 p-4 ${field.span === 2 ? "sm:col-span-2" : ""}`}
                >
                  <p className="label-caps">{field.label}</p>
                  <div className="mt-2">{field.content}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="bg-panel overflow-hidden">
            <CardHeader className="border-b border-border/50 pb-4">
              <p className="label-caps mb-1">Notes</p>
              <CardTitle className="font-display text-lg">Details</CardTitle>
              <CardDescription>Description and additional notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5 text-sm">
              <div className="rounded-2xl border border-border/60 bg-muted/15 p-4">
                <p className="label-caps">Description</p>
                <p className="mt-2 break-words whitespace-pre-wrap leading-relaxed">
                  {task.description?.trim() || "No description provided."}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/15 p-4">
                <p className="label-caps">Notes</p>
                <p className="mt-2 break-words whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {task.notes?.trim() || "No notes added."}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete task?"
        description="This action cannot be undone. The task will be permanently removed."
        confirmLabel="Delete task"
        isLoading={deleteTask.isPending}
        onConfirm={() => void handleDelete()}
      />
    </motion.div>
  );
}
