import { z } from "zod";

export const dashboardQuerySchema = z.object({
  tzOffset: z.coerce.number().int().min(-840).max(840).optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
