"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { TaskForm, type TaskFormSubmitValues } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiRequestError } from "@/lib/api-client";
import { useSubjects } from "@/hooks/use-subjects";
import { useTask, useUpdateTask } from "@/hooks/use-tasks";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";

type TaskEditViewProps = {
  taskId: string;
};

export function TaskEditView({ taskId }: TaskEditViewProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const {
    data: task,
    isLoading: isTaskLoading,
    isError: isTaskError,
    error: taskError,
    refetch: refetchTask,
  } = useTask(taskId);
  const {
    data: subjects,
    isLoading: isSubjectsLoading,
    isError: isSubjectsError,
    error: subjectsError,
    refetch: refetchSubjects,
  } = useSubjects();
  const updateTask = useUpdateTask(taskId);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleUpdate(values: TaskFormSubmitValues) {
    setFormError(null);

    try {
      await updateTask.mutateAsync(values);
      router.push(`/tasks/${taskId}`);
    } catch (mutationError) {
      setFormError(
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Unable to update task. Please try again.",
      );
    }
  }

  if (isTaskLoading || isSubjectsLoading) {
    return <LoadingSkeleton variant="form" />;
  }

  if (isTaskError || !task) {
    return (
      <ErrorState
        message={taskError instanceof Error ? taskError.message : "Unable to load task."}
        onRetry={() => refetchTask()}
      />
    );
  }

  if (isSubjectsError) {
    return (
      <ErrorState
        message={
          subjectsError instanceof Error ? subjectsError.message : "Unable to load subjects."
        }
        onRetry={() => refetchSubjects()}
      />
    );
  }

  return (
    <motion.div
      className="mx-auto max-w-3xl space-y-6"
      variants={staggerContainer(0.05, 0.02)}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <PageHeader
          eyebrow="Tasks"
          title="Edit task"
          description="Update task details, scheduling, and notes."
          action={
            <Button variant="outline" render={<Link href={`/tasks/${taskId}`} />}>
              <ArrowLeft className="h-4 w-4" />
              Back to task
            </Button>
          }
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="bg-panel-elevated overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <p className="label-caps mb-1">Editing</p>
            <CardTitle className="font-display line-clamp-2 text-lg">{task.title}</CardTitle>
            <CardDescription>Make changes and save when you are ready.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {formError ? (
              <div className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            ) : null}
            <TaskForm
              subjects={subjects ?? []}
              submitLabel="Save changes"
              isSubmitting={updateTask.isPending}
              defaultValues={{
                title: task.title,
                description: task.description ?? undefined,
                subjectId: task.subjectId,
                type: task.type,
                priority: task.priority,
                status: task.status,
                dueDate: task.dueDate ?? undefined,
                estimatedTimeMinutes: task.estimatedTimeMinutes,
                notes: task.notes ?? undefined,
              }}
              onSubmit={handleUpdate}
              onCancel={() => router.push(`/tasks/${taskId}`)}
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
