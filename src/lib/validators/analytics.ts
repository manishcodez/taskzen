import { z } from "zod";

export const analyticsQuerySchema = z.object({
  tzOffset: z.coerce.number().int().min(-840).max(840).optional(),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
