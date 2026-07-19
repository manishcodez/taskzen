"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskList } from "@/components/tasks/task-list";
import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/lib/api-client";
import { getClientTimezoneOffset } from "@/lib/utils/date-ranges";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSubjects } from "@/hooks/use-subjects";
import {
  useCompleteTask,
  useReopenTask,
  useTasks,
} from "@/hooks/use-tasks";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";
import type { TaskListFilters } from "@/types";

export function TasksView() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [filters, setFilters] = useState<TaskListFilters>({
    page: 1,
    limit: 20,
    sortBy: "dueDate",
    sortOrder: "asc",
    tzOffset: getClientTimezoneOffset(),
  });
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<"complete" | "reopen" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(filters.q ?? "", 300);
  const queryFilters = useMemo(
    () => ({
      ...filters,
      q: debouncedSearch || undefined,
    }),
    [filters, debouncedSearch],
  );

  const { data: subjects = [] } = useSubjects();
  const { data, isLoading, isFetching, isError, error, refetch } = useTasks(queryFilters);
  const completeTask = useCompleteTask();
  const reopenTask = useReopenTask();

  async function handleComplete(taskId: string) {
    setActionError(null);
    setActiveTaskId(taskId);
    setActiveAction("complete");

    try {
      await completeTask.mutateAsync(taskId);
    } catch (mutationError) {
      setActionError(
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Unable to complete task.",
      );
    } finally {
      setActiveTaskId(null);
      setActiveAction(null);
    }
  }

  async function handleReopen(taskId: string) {
    setActionError(null);
    setActiveTaskId(taskId);
    setActiveAction("reopen");

    try {
      await reopenTask.mutateAsync(taskId);
    } catch (mutationError) {
      setActionError(
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Unable to reopen task.",
      );
    } finally {
      setActiveTaskId(null);
      setActiveAction(null);
    }
  }

  const tasks = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer(0.05, 0.02)}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Tasks"
          description="Manage assignments, deadlines, priorities, and academic workload."
          action={
            <Button render={<Link href="/tasks/new" />}>
              <Plus className="h-4 w-4" />
              Add task
            </Button>
          }
        />
      </motion.div>

      <TaskFilters filters={filters} subjects={subjects} onChange={setFilters} />

      <AnimatePresence mode="wait">
        {actionError ? (
          <motion.div
            key="action-error"
            initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {actionError}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {isLoading ? (
        <motion.div variants={fadeUp}>
          <LoadingSkeleton variant="tasks" />
        </motion.div>
      ) : null}

      {!isLoading && isError ? (
        <motion.div variants={fadeUp}>
          <ErrorState
            message={error instanceof Error ? error.message : "Unable to load tasks."}
            onRetry={() => refetch()}
          />
        </motion.div>
      ) : null}

      {!isLoading && !isError && tasks.length === 0 ? (
        <motion.div variants={fadeUp}>
          <EmptyState
            title="No tasks found"
            description="Create a task or adjust your filters to see results."
            actionLabel="Add task"
            onAction={() => router.push("/tasks/new")}
          />
        </motion.div>
      ) : null}

      {!isLoading && !isError && tasks.length > 0 ? (
        <motion.div className="space-y-4" variants={fadeUp} layout={!prefersReducedMotion}>
          <AnimatePresence mode="wait">
            {isFetching ? (
              <motion.p
                key="fetching"
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="label-caps text-primary/70"
              >
                Updating results...
              </motion.p>
            ) : null}
          </AnimatePresence>
          <TaskList
            tasks={tasks}
            onComplete={handleComplete}
            onReopen={handleReopen}
            activeTaskId={activeTaskId}
            activeAction={activeAction}
          />

          {pagination && pagination.totalPages > 1 ? (
            <div className="bg-panel flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} • {pagination.total} tasks
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: Math.max(1, (current.page ?? 1) - 1),
                    }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: (current.page ?? 1) + 1,
                    }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </motion.div>
  );
}
