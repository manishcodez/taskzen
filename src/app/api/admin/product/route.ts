import { requireAdminUser } from "@/lib/auth/admin";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getAdminProductAnalytics } from "@/services/admin.service";

export async function GET() {
  try {
    await requireAdminUser();
    const product = await getAdminProductAnalytics();
    return apiSuccess({ product });
  } catch (error) {
    return handleApiError(error);
  }
}
