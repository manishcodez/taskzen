import { requireAdminUser } from "@/lib/auth/admin";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getAdminSystemHealth } from "@/services/admin.service";

export async function GET() {
  try {
    await requireAdminUser();
    const health = await getAdminSystemHealth();
    return apiSuccess({ health });
  } catch (error) {
    return handleApiError(error);
  }
}
