"use client";

import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { MotionDiv } from "@/components/motion/motion-div";
import { SubjectCard } from "@/components/subjects/subject-card";
import { SubjectForm } from "@/components/subjects/subject-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiRequestError } from "@/lib/api-client";
import { useCreateSubject, useSubjects } from "@/hooks/use-subjects";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { CreateSubjectInput } from "@/lib/validators/subjects";

export function SubjectsView() {
  const prefersReducedMotion = useReducedMotion();
  const { data, isLoading, isError, error, refetch } = useSubjects();
  const createSubject = useCreateSubject();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleCreate(values: CreateSubjectInput) {
    setFormError(null);

    try {
      await createSubject.mutateAsync(values);
      setSuccessMessage("Subject created successfully.");
      setIsCreateOpen(false);
    } catch (mutationError) {
      const message =
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Unable to create subject. Please try again.";
      setFormError(message);
    }
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Unable to load subjects."}
        onRetry={() => refetch()}
      />
    );
  }

  const subjects = data ?? [];

  return (
    <MotionDiv
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
      variants={staggerContainer(0.07, 0.04)}
      className="space-y-6"
    >
      <motion.div variants={fadeUp}>
        <PageHeader
          eyebrow="Subjects"
          title="Course library"
          description="Organize your academic work by course or subject."
          action={
            <Button onClick={() => setIsCreateOpen(true)} className="shadow-soft">
              <Plus className="h-4 w-4" />
              Add subject
            </Button>
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

      {subjects.length === 0 ? (
        <motion.div variants={fadeUp}>
          <EmptyState
            title="No subjects yet"
            description="Create your first subject to start organizing tasks and assignments by course."
            actionLabel="Add subject"
            onAction={() => setIsCreateOpen(true)}
          />
        </motion.div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject, index) => (
            <motion.div
              key={subject.id}
              variants={fadeUp}
              custom={index}
            >
              <SubjectCard subject={subject} />
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-border/70 bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Add subject</DialogTitle>
            <DialogDescription>
              Create a subject to group related tasks and assignments.
            </DialogDescription>
          </DialogHeader>
          {formError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          ) : null}
          <SubjectForm
            submitLabel="Create subject"
            isSubmitting={createSubject.isPending}
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </MotionDiv>
  );
}
