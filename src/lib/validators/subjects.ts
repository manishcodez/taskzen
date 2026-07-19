import { z } from "zod";

const hexColorRegex = /^#([0-9A-Fa-f]{6})$/;

export const subjectColorSchema = z
  .string()
  .trim()
  .regex(hexColorRegex, "Color must be a valid hex code like #6366f1");

export const createSubjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Subject name is required")
    .max(100, "Subject name must be 100 characters or fewer"),
  code: z
    .string()
    .trim()
    .max(30, "Subject code must be 30 characters or fewer")
    .optional()
    .or(z.literal("")),
  color: subjectColorSchema,
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer")
    .optional()
    .or(z.literal("")),
});

export const updateSubjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Subject name is required")
      .max(100, "Subject name must be 100 characters or fewer")
      .optional(),
    code: z
      .string()
      .trim()
      .max(30, "Subject code must be 30 characters or fewer")
      .optional()
      .or(z.literal("")),
    color: subjectColorSchema.optional(),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be 2000 characters or fewer")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
