import { getCurrentUser } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "Your session has expired. Please sign in again.", 401);
  }

  return apiSuccess({ user });
}
