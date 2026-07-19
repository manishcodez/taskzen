"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useEffect, useMemo, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";
import {
  selectClassName,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_TYPE_OPTIONS,
} from "@/lib/tasks/labels";
import type { SubjectSummary } from "@/types";

const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  subjectId: z.string().min(1, "Select a subject"),
  type: z.string().min(1),
  priority: z.string().min(1),
  status: z.string().min(1),
  dueDateLocal: z.string().optional().or(z.literal("")),
  estimatedHours: z.string().optional(),
  estimatedMinutesPart: z.string().optional(),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export type TaskFormSubmitValues = {
  title: string;
  description?: string;
  subjectId: string;
  type: string;
  priority: string;
  status: string;
  dueDate?: string;
  estimatedTimeMinutes?: number | null;
  notes?: string;
};

type TaskFormProps = {
  subjects: SubjectSummary[];
  defaultValues?: Partial<TaskFormSubmitValues>;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: TaskFormSubmitValues) => Promise<void> | void;
  onCancel?: () => void;
};

function toLocalDateTimeValue(isoDate: string | null | undefined): string {
  if (!isoDate) return "";

  const date = new Date(isoDate);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function splitEstimatedMinutes(minutes: number | null | undefined) {
  if (minutes == null) {
    return { hours: "", minutesPart: "" };
  }

  return {
    hours: String(Math.floor(minutes / 60)),
    minutesPart: String(minutes % 60),
  };
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/10 p-5">
      <p className="label-caps">{title}</p>
      {children}
    </div>
  );
}

export function TaskForm({
  subjects,
  defaultValues,
  submitLabel,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const prefersReducedMotion = useReducedMotion();
  const estimated = splitEstimatedMinutes(defaultValues?.estimatedTimeMinutes);

  const initialValues = useMemo(
    () => ({
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      subjectId: defaultValues?.subjectId ?? subjects[0]?.id ?? "",
      type: defaultValues?.type ?? "OTHER",
      priority: defaultValues?.priority ?? "MEDIUM",
      status: defaultValues?.status ?? "NOT_STARTED",
      dueDateLocal: toLocalDateTimeValue(defaultValues?.dueDate),
      estimatedHours: estimated.hours,
      estimatedMinutesPart: estimated.minutesPart,
      notes: defaultValues?.notes ?? "",
    }),
    [defaultValues, estimated.hours, estimated.minutesPart, subjects],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  async function handleFormSubmit(values: TaskFormValues) {
    const hoursValue = values.estimatedHours?.trim() ?? "";
    const minutesValue = values.estimatedMinutesPart?.trim() ?? "";
    const hours = hoursValue === "" ? 0 : Number(hoursValue);
    const minutesPart = minutesValue === "" ? 0 : Number(minutesValue);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutesPart) ||
      hours < 0 ||
      hours > 24 ||
      minutesPart < 0 ||
      minutesPart > 59
    ) {
      return;
    }

    const totalMinutes = hours * 60 + minutesPart;

    await onSubmit({
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      subjectId: values.subjectId,
      type: values.type,
      priority: values.priority,
      status: values.status,
      dueDate: values.dueDateLocal
        ? new Date(values.dueDateLocal).toISOString()
        : undefined,
      estimatedTimeMinutes: totalMinutes > 0 ? totalMinutes : null,
      notes: values.notes?.trim() || undefined,
    });
  }

  if (subjects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
        Create at least one subject before adding tasks.
      </div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6"
      variants={staggerContainer(0.05, 0.02)}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
    >
      <motion.div variants={fadeUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} aria-invalid={Boolean(errors.title)} />
          {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={3} {...register("description")} />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <FormSection title="Classification">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subjectId">Subject</Label>
              <select id="subjectId" className={selectClassName()} {...register("subjectId")}>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {errors.subjectId ? (
                <p className="text-sm text-destructive">{errors.subjectId.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Task type</Label>
              <select id="type" className={selectClassName()} {...register("type")}>
                {TASK_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select id="priority" className={selectClassName()} {...register("priority")}>
                {TASK_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" className={selectClassName()} {...register("status")}>
                {TASK_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FormSection>
      </motion.div>

      <motion.div variants={fadeUp}>
        <FormSection title="Scheduling">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dueDateLocal">Due date</Label>
              <Input id="dueDateLocal" type="datetime-local" {...register("dueDateLocal")} />
            </div>

            <div className="space-y-2">
              <Label>Estimated time</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min={0}
                  max={24}
                  placeholder="Hours"
                  {...register("estimatedHours")}
                />
                <Input
                  type="number"
                  min={0}
                  max={59}
                  placeholder="Minutes"
                  {...register("estimatedMinutesPart")}
                />
              </div>
            </div>
          </div>
        </FormSection>
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={4} {...register("notes")} />
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="flex flex-col-reverse gap-2 border-t border-border/50 pt-5 sm:flex-row sm:justify-end"
      >
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </motion.div>
    </motion.form>
  );
}
