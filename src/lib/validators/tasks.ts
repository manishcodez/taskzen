import { TaskPriority, TaskStatus, TaskType } from "@/generated/prisma/client";
import { z } from "zod";

const taskTypeValues = Object.values(TaskType) as [TaskType, ...TaskType[]];
const taskPriorityValues = Object.values(TaskPriority) as [TaskPriority, ...TaskPriority[]];
const taskStatusValues = Object.values(TaskStatus) as [TaskStatus, ...TaskStatus[]];

export const taskTypeSchema = z.enum(taskTypeValues);
export const taskPrioritySchema = z.enum(taskPriorityValues);
export const taskStatusSchema = z.enum(taskStatusValues);

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(5000, "Description must be 5000 characters or fewer")
    .optional()
    .or(z.literal("")),
  subjectId: z.string().uuid("Select a valid subject"),
  type: taskTypeSchema.default(TaskType.OTHER),
  priority: taskPrioritySchema.default(TaskPriority.MEDIUM),
  status: taskStatusSchema.default(TaskStatus.NOT_STARTED),
  dueDate: z
    .string()
    .datetime({ message: "Enter a valid due date" })
    .optional()
    .or(z.literal("")),
  estimatedTimeMinutes: z
    .number()
    .int("Estimated time must be a whole number of minutes")
    .min(0, "Estimated time cannot be negative")
    .max(24 * 60, "Estimated time cannot exceed 24 hours")
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(5000, "Notes must be 5000 characters or fewer")
    .optional()
    .or(z.literal("")),
});

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200, "Title must be 200 characters or fewer")
      .optional(),
    description: z
      .string()
      .trim()
      .max(5000, "Description must be 5000 characters or fewer")
      .optional()
      .or(z.literal("")),
    subjectId: z.string().uuid("Select a valid subject").optional(),
    type: taskTypeSchema.optional(),
    priority: taskPrioritySchema.optional(),
    status: taskStatusSchema.optional(),
    dueDate: z
      .string()
      .datetime({ message: "Enter a valid due date" })
      .nullable()
      .optional()
      .or(z.literal("")),
    estimatedTimeMinutes: z
      .number()
      .int("Estimated time must be a whole number of minutes")
      .min(0, "Estimated time cannot be negative")
      .max(24 * 60, "Estimated time cannot exceed 24 hours")
      .nullable()
      .optional(),
    notes: z
      .string()
      .trim()
      .max(5000, "Notes must be 5000 characters or fewer")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });

export const taskListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  subjectId: z.string().uuid().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  type: taskTypeSchema.optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  dueToday: z.enum(["true", "false"]).optional(),
  dueThisWeek: z.enum(["true", "false"]).optional(),
  completed: z.enum(["true", "false"]).optional(),
  overdue: z.enum(["true", "false"]).optional(),
  sortBy: z.enum(["dueDate", "priority", "createdAt", "status", "subject"]).default("dueDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tzOffset: z.coerce.number().int().min(-840).max(840).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
