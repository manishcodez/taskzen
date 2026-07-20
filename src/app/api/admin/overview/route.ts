import { requireAdminUser } from "@/lib/auth/admin";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getAdminOverviewStats } from "@/services/admin.service";

export async function GET() {
  try {
    await requireAdminUser();
    const overview = await getAdminOverviewStats();
    return apiSuccess({ overview });
  } catch (error) {
    return handleApiError(error);
  }
}
