import { AppError, apiSuccess, handleApiError } from "@/lib/api-response";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { changePasswordSchema } from "@/lib/validators/auth";
import { db } from "@/lib/db";
import { updatePasswordForUser } from "@/services/subject.service";

export async function PATCH(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const body = await request.json();
    const data = changePasswordSchema.parse(body);

    const account = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!account) {
      throw new AppError("NOT_FOUND", "Account not found.", 404);
    }

    const isValidPassword = await verifyPassword(data.currentPassword, account.passwordHash);

    if (!isValidPassword) {
      throw new AppError("INVALID_CREDENTIALS", "Current password is incorrect.", 401, {
        currentPassword: ["Current password is incorrect."],
      });
    }

    const passwordHash = await hashPassword(data.newPassword);
    await updatePasswordForUser(user.id, passwordHash);

    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
