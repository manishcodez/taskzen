import { z } from "zod";

export const calendarQuerySchema = z.object({
  year: z.coerce.number().int().min(1970).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  tzOffset: z.coerce.number().int().min(-840).max(840).optional(),
});

export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
