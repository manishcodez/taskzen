"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { SubjectColorPicker } from "@/components/subjects/subject-color-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createSubjectSchema,
  type CreateSubjectInput,
} from "@/lib/validators/subjects";

type SubjectFormProps = {
  defaultValues?: Partial<CreateSubjectInput>;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: CreateSubjectInput) => Promise<void> | void;
  onCancel?: () => void;
};

export function SubjectForm({
  defaultValues,
  submitLabel,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: SubjectFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateSubjectInput>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: "",
      code: "",
      color: "#6366f1",
      description: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    reset({
      name: "",
      code: "",
      color: "#6366f1",
      description: "",
      ...defaultValues,
    });
  }, [defaultValues, reset]);

  const selectedColor = watch("color");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name" className="label-caps normal-case tracking-[0.12em]">
          Subject name
        </Label>
        <Input
          id="name"
          placeholder="Data Structures"
          aria-invalid={Boolean(errors.name)}
          className="rounded-xl border-border/70 bg-background/80"
          {...register("name")}
        />
        {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="code" className="label-caps normal-case tracking-[0.12em]">
          Subject code
        </Label>
        <Input
          id="code"
          placeholder="CS201"
          aria-invalid={Boolean(errors.code)}
          className="rounded-xl border-border/70 bg-background/80"
          {...register("code")}
        />
        {errors.code ? <p className="text-sm text-destructive">{errors.code.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label className="label-caps normal-case tracking-[0.12em]">Color</Label>
        <SubjectColorPicker
          value={selectedColor}
          onChange={(color) => setValue("color", color, { shouldValidate: true })}
          disabled={isSubmitting}
        />
        {errors.color ? <p className="text-sm text-destructive">{errors.color.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="label-caps normal-case tracking-[0.12em]">
          Description
        </Label>
        <Textarea
          id="description"
          rows={4}
          placeholder="Optional notes about this subject"
          aria-invalid={Boolean(errors.description)}
          className="rounded-xl border-border/70 bg-background/80"
          {...register("description")}
        />
        {errors.description ? (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting} className="shadow-soft">
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
