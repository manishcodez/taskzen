import { AppError } from "@/lib/api-response";
import type { SafeUser } from "@/lib/auth/constants";
import { isAdminEmail } from "@/lib/auth/admin-config";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

export { getAdminUserEmail, isAdminEmail } from "@/lib/auth/admin-config";

export function isAdminUser(user: Pick<SafeUser, "email">): boolean {
  return isAdminEmail(user.email);
}

export function withAdminFlag<T extends Pick<SafeUser, "email">>(user: T): T & { isAdmin: boolean } {
  return {
    ...user,
    isAdmin: isAdminUser(user),
  };
}

export async function requireAdminUser(): Promise<SafeUser> {
  const user = await requireAuthenticatedUser();

  if (!isAdminUser(user)) {
    throw new AppError("FORBIDDEN", "You do not have permission to access this resource.", 403);
  }

  return user;
}
