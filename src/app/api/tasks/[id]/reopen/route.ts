import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { reopenTaskForUser } from "@/services/task.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await context.params;
    const task = await reopenTaskForUser(user.id, id);
    return apiSuccess({ task });
  } catch (error) {
    return handleApiError(error);
  }
}
