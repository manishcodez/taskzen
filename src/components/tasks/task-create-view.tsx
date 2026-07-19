"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { TaskForm, type TaskFormSubmitValues } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiRequestError } from "@/lib/api-client";
import { useSubjects } from "@/hooks/use-subjects";
import { useCreateTask } from "@/hooks/use-tasks";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function TaskCreateView() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const presetSubjectId = searchParams.get("subjectId") ?? undefined;
  const { data: subjects, isLoading, isError, error, refetch } = useSubjects();
  const createTask = useCreateTask();
  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreate(values: TaskFormSubmitValues) {
    setFormError(null);

    try {
      const task = await createTask.mutateAsync(values);
      router.push(`/tasks/${task.id}`);
    } catch (mutationError) {
      setFormError(
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Unable to create task. Please try again.",
      );
    }
  }

  if (isLoading) {
    return <LoadingSkeleton variant="form" />;
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Unable to load subjects."}
        onRetry={() => refetch()}
      />
    );
  }

  const subjectList = subjects ?? [];

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
          title="Create task"
          description="Add a new assignment, deadline, or study task."
          action={
            <Button variant="outline" render={<Link href="/tasks" />}>
              <ArrowLeft className="h-4 w-4" />
              Back to tasks
            </Button>
          }
        />
      </motion.div>

      {subjectList.length === 0 ? (
        <motion.div variants={fadeUp}>
          <EmptyState
            title="Create a subject first"
            description="Tasks must belong to a subject. Add at least one subject before creating tasks."
            actionLabel="Go to subjects"
            onAction={() => router.push("/subjects")}
          />
        </motion.div>
      ) : (
        <motion.div variants={fadeUp}>
          <Card className="bg-panel-elevated overflow-hidden">
            <CardHeader className="border-b border-border/50 pb-4">
              <p className="label-caps mb-1">New</p>
              <CardTitle className="font-display text-lg">Task details</CardTitle>
              <CardDescription>Fill in the task information below.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {formError ? (
                <div className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {formError}
                </div>
              ) : null}
              <TaskForm
                subjects={subjectList}
                defaultValues={
                  presetSubjectId && subjectList.some((subject) => subject.id === presetSubjectId)
                    ? { subjectId: presetSubjectId }
                    : undefined
                }
                submitLabel="Create task"
                isSubmitting={createTask.isPending}
                onSubmit={handleCreate}
                onCancel={() => router.push("/tasks")}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
