import { requireAdminUser } from "@/lib/auth/admin";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getAdminUserAnalytics } from "@/services/admin.service";

export async function GET() {
  try {
    await requireAdminUser();
    const users = await getAdminUserAnalytics();
    return apiSuccess({ users });
  } catch (error) {
    return handleApiError(error);
  }
}
