import { clearAuthCookies } from "@/lib/auth/session";
import { apiSuccess } from "@/lib/api-response";

export async function POST() {
  const response = apiSuccess({ success: true });
  clearAuthCookies(response);
  return response;
}
