"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { MotionDiv } from "@/components/motion/motion-div";
import { SubjectForm } from "@/components/subjects/subject-form";
import { OverdueBadge, PriorityBadge, StatusBadge } from "@/components/tasks/task-badges";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiRequestError } from "@/lib/api-client";
import { TASK_TYPE_LABELS } from "@/lib/tasks/labels";
import { useDeleteSubject, useSubject, useUpdateSubject } from "@/hooks/use-subjects";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { CreateSubjectInput } from "@/lib/validators/subjects";
import { isTaskOverdue } from "@/lib/utils/time";

type SubjectDetailViewProps = {
  subjectId: string;
};

export function SubjectDetailView({ subjectId }: SubjectDetailViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useSubject(subjectId);
  const updateSubject = useUpdateSubject(subjectId);
  const deleteSubject = useDeleteSubject();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleUpdate(values: CreateSubjectInput) {
    setFormError(null);

    try {
      await updateSubject.mutateAsync(values);
      setSuccessMessage("Subject updated successfully.");
      setIsEditOpen(false);
    } catch (mutationError) {
      const message =
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Unable to update subject. Please try again.";
      setFormError(message);
    }
  }

  async function handleDelete() {
    setActionError(null);

    try {
      await deleteSubject.mutateAsync(subjectId);
      router.push("/subjects");
    } catch (mutationError) {
      const message =
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Unable to delete subject. Please try again.";
      setActionError(message);
      setIsDeleteOpen(false);
    }
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        title={error instanceof ApiRequestError && error.status === 404 ? "Subject not found" : "Unable to load subject"}
        message={
          error instanceof ApiRequestError
            ? error.message
            : "Please try again or return to your subjects list."
        }
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <MotionDiv
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
      variants={staggerContainer(0.06, 0.03)}
      className="space-y-6"
    >
      <motion.div variants={fadeUp}>
        <PageHeader
          eyebrow="Subject"
          title={data.name}
          description={data.code ? `Subject code: ${data.code}` : "Manage this subject and view related tasks."}
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setIsEditOpen(true)} className="shadow-soft">
                Edit subject
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteOpen(true)}
                disabled={data.taskCount > 0}
              >
                Delete subject
              </Button>
            </div>
          }
        />
      </motion.div>

      {successMessage ? (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success shadow-soft"
        >
          {successMessage}
        </motion.div>
      ) : null}

      {actionError ? (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-soft"
        >
          {actionError}
        </motion.div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <motion.div variants={fadeUp} className="bg-panel overflow-hidden">
          <div
            className="h-2 w-full"
            style={{
              background: `linear-gradient(90deg, ${data.color}, ${data.color}66, oklch(0.68 0.14 38 / 0.4))`,
            }}
          />
          <div className="border-b border-border/60 bg-gradient-to-r from-primary/8 via-accent/5 to-transparent px-5 py-4">
            <div className="flex items-center gap-3">
              <span
                className="h-5 w-5 rounded-full shadow-soft ring-2 ring-background"
                style={{ backgroundColor: data.color }}
              />
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight">{data.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="metric-display text-2xl text-primary">{data.taskCount}</span>{" "}
                  related tasks
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-5">
            {data.description ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{data.description}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground">No description added yet.</p>
            )}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-panel overflow-hidden">
          <div className="border-b border-border/60 bg-gradient-to-r from-accent/8 to-transparent px-5 py-4">
            <p className="label-caps text-accent">Summary</p>
          </div>
          <div className="space-y-3 p-5 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5">
              <span className="text-muted-foreground">Tasks</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {data.taskCount}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5">
              <span className="text-muted-foreground">Color</span>
              <div className="flex items-center gap-2">
                <span
                  className="h-3.5 w-3.5 rounded-full shadow-soft"
                  style={{ backgroundColor: data.color }}
                />
                <span className="font-medium">{data.color}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full shadow-soft" render={<Link href="/subjects" />}>
              Back to subjects
            </Button>
          </div>
        </motion.div>
      </div>

      <motion.div variants={fadeUp} className="bg-panel overflow-hidden">
        <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-accent/6 to-transparent px-5 py-4">
          <p className="label-caps text-primary">Related tasks</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tasks linked to this subject. Open a task to view details or update progress.
          </p>
        </div>
        <div className="p-5">
          {data.tasks.length === 0 ? (
            <EmptyState
              title="No tasks in this subject yet"
              description="Create a task for this subject to start tracking assignments and deadlines."
              actionLabel="Add task"
              onAction={() => router.push(`/tasks/new?subjectId=${subjectId}`)}
            />
          ) : (
            <div className="space-y-2.5">
              {data.tasks.map((task) => {
                const overdue = isTaskOverdue(task.dueDate, task.status);

                return (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="group flex flex-col gap-2 rounded-xl border border-border/60 bg-card/90 p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium transition-colors group-hover:text-primary">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {TASK_TYPE_LABELS[task.type] ?? task.type} • {task.priority}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                      {overdue ? <OverdueBadge /> : null}
                      {task.dueDate ? (
                        <Badge variant="secondary" className="bg-muted/60">
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </Badge>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-border/70 bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit subject</DialogTitle>
            <DialogDescription>Update the subject details below.</DialogDescription>
          </DialogHeader>
          {formError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          ) : null}
          <SubjectForm
            submitLabel="Save changes"
            isSubmitting={updateSubject.isPending}
            defaultValues={{
              name: data.name,
              code: data.code ?? "",
              color: data.color,
              description: data.description ?? "",
            }}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete subject?"
        description={
          data.taskCount > 0
            ? "This subject still has tasks. Delete or reassign those tasks before deleting the subject."
            : "This action cannot be undone. The subject will be permanently removed."
        }
        confirmLabel={data.taskCount > 0 ? "Cannot delete" : "Delete subject"}
        isLoading={deleteSubject.isPending}
        onConfirm={() => {
          if (data.taskCount === 0) {
            void handleDelete();
          }
        }}
      />
    </MotionDiv>
  );
}
