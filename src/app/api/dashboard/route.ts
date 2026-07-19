import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { dashboardQuerySchema } from "@/lib/validators/dashboard";
import { getDashboardForUser } from "@/services/dashboard.service";

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const query = dashboardQuerySchema.parse(Object.fromEntries(searchParams.entries()));
    const dashboard = await getDashboardForUser(user.id, query.tzOffset ?? 0);
    return apiSuccess({ dashboard });
  } catch (error) {
    return handleApiError(error);
  }
}
