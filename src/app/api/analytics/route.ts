import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { analyticsQuerySchema } from "@/lib/validators/analytics";
import { getAnalyticsForUser } from "@/services/analytics.service";

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const query = analyticsQuerySchema.parse(Object.fromEntries(searchParams.entries()));
    const analytics = await getAnalyticsForUser(user.id, query.tzOffset ?? 0);
    return apiSuccess({ analytics });
  } catch (error) {
    return handleApiError(error);
  }
}
