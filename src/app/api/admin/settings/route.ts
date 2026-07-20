import { requireAdminUser } from "@/lib/auth/admin";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getAdminSettingsInfo } from "@/services/admin.service";

export async function GET() {
  try {
    await requireAdminUser();
    const settings = await getAdminSettingsInfo();
    return apiSuccess({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}
