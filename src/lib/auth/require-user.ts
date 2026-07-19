import { AppError } from "@/lib/api-response";
import type { SafeUser } from "@/lib/auth/constants";
import { getCurrentUser } from "@/lib/auth/session";

export async function requireAuthenticatedUser(): Promise<SafeUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AppError(
      "UNAUTHORIZED",
      "Your session has expired. Please sign in again.",
      401,
    );
  }

  return user;
}
