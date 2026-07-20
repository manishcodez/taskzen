import { requireAdminUser } from "@/lib/auth/admin";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getAdminActivityStats } from "@/services/admin.service";

export async function GET() {
  try {
    await requireAdminUser();
    const activity = await getAdminActivityStats();
    return apiSuccess({ activity });
  } catch (error) {
    return handleApiError(error);
  }
}
