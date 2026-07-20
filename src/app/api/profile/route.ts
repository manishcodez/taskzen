import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { toSafeUser } from "@/lib/auth/session";
import { updateProfileSchema } from "@/lib/validators/profile";
import { updateProfileForUser } from "@/services/subject.service";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    return apiSuccess({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    const updatedUser = await updateProfileForUser(user.id, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.course !== undefined ? { course: data.course } : {}),
      ...(data.college !== undefined ? { college: data.college } : {}),
      ...(data.semester !== undefined ? { semester: data.semester } : {}),
      ...(data.academicYear !== undefined ? { academicYear: data.academicYear } : {}),
      ...(data.emailDeadlineReminders !== undefined
        ? { emailDeadlineReminders: data.emailDeadlineReminders }
        : {}),
      ...(data.emailOverdueNotifications !== undefined
        ? { emailOverdueNotifications: data.emailOverdueNotifications }
        : {}),
    });

    return apiSuccess({ user: toSafeUser(updatedUser) });
  } catch (error) {
    return handleApiError(error);
  }
}
