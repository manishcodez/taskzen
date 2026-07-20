import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer")
    .optional()
    .or(z.literal("")),
  course: z
    .string()
    .trim()
    .max(100, "Course must be 100 characters or fewer")
    .optional()
    .or(z.literal("")),
  college: z
    .string()
    .trim()
    .max(150, "College must be 150 characters or fewer")
    .optional()
    .or(z.literal("")),
  semester: z
    .string()
    .trim()
    .max(50, "Semester must be 50 characters or fewer")
    .optional()
    .or(z.literal("")),
  academicYear: z
    .string()
    .trim()
    .max(20, "Academic year must be 20 characters or fewer")
    .optional()
    .or(z.literal("")),
  emailDeadlineReminders: z.boolean().optional(),
  emailOverdueNotifications: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
